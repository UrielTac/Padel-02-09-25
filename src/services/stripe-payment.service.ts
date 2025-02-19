import { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { createId } from '@paralleldrive/cuid2';
import type { NoShowChargeRequest } from '@/types/api';
import { ValidationService } from './ValidationService';
import { Database } from '@/types/supabase';

interface PaymentServiceError {
  code: string;
  message: string;
  details?: any;
}

interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  chargeStatus?: string;
  error?: PaymentServiceError;
}

export class StripePaymentService {
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly MAX_CHARGE_AMOUNT = 10000; // 100€ en céntimos
  private readonly validationService: ValidationService;

  constructor(
    private stripe: Stripe,
    private supabase: SupabaseClient<Database>
  ) {
    this.validationService = new ValidationService(this.supabase);
  }

  async chargeNoShow({
    bookingId,
    amount,
    reason,
    stripeAccountId,
    empresaId
  }: NoShowChargeRequest): Promise<PaymentResult> {
    const requestId = createId();
    console.log(`🔄 [${requestId}] Iniciando proceso de cargo por no-show:`, {
      bookingId,
      amount
    });

    try {
      // Validar monto máximo
      if (amount > this.MAX_CHARGE_AMOUNT) {
        throw {
          code: 'INVALID_AMOUNT',
          message: `El monto máximo permitido es ${this.MAX_CHARGE_AMOUNT/100}€`
        };
      }

      // Validar todos los requisitos
      const validationResult = await this.validationService.validateNoShowCharge(
        empresaId,
        bookingId,
        amount
      );

      if (!validationResult.isValid) {
        throw {
          code: validationResult.errors[0].code,
          message: validationResult.errors[0].message,
          details: validationResult.context
        };
      }

      const { booking, stripe_connection, stripe_customer } = validationResult.data!;

      // Iniciar transacción
      const { error: txError } = await this.supabase.rpc('begin_no_show_charge_transaction', {
        p_booking_id: bookingId
      });

      if (txError) throw txError;

      try {
        // Procesar cargo con reintentos
        const paymentIntent = await this.retryOperation(
          () => this.processCharge({
            amount,
            customerId: stripe_customer.stripe_customer_id,
            stripeAccountId: stripe_connection.stripe_account_id,
            metadata: {
              booking_id: bookingId,
              charge_type: 'no_show',
              reason: reason || 'No show charge'
            }
          })
        );

        // Registrar el cargo
        await this.recordPayment({
          bookingId,
          amount,
          paymentIntentId: paymentIntent.id,
          reason,
          status: paymentIntent.status
        });

        // Actualizar estado de reserva
        await this.updateBookingStatus(bookingId, {
          status: 'cancelled',
          reason,
          chargeApplied: true
        });

        // Confirmar transacción
        await this.supabase.rpc('commit_no_show_charge_transaction', {
          p_booking_id: bookingId
        });

        console.log(`✅ [${requestId}] Cargo procesado exitosamente:`, {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status
        });

        return {
          success: true,
          paymentIntentId: paymentIntent.id,
          chargeStatus: paymentIntent.status
        };

      } catch (error) {
        // Rollback en caso de error
        await this.supabase.rpc('rollback_no_show_charge_transaction', {
          p_booking_id: bookingId
        });
        throw error;
      }

    } catch (error: any) {
      console.error(`❌ [${requestId}] Error en chargeNoShow:`, error);
      
      // Registrar error
      await this.logError(error, {
        requestId,
        bookingId,
        type: 'no_show_charge'
      });

      return {
        success: false,
        error: {
          code: error.code || 'PAYMENT_ERROR',
          message: error.message,
          details: error.details
        }
      };
    }
  }

  private async processCharge({
    amount,
    customerId,
    stripeAccountId,
    metadata
  }: {
    amount: number;
    customerId: string;
    stripeAccountId: string;
    metadata: Record<string, any>;
  }) {
    try {
      return await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'eur',
        customer: customerId,
        off_session: true,
        confirm: true,
        metadata,
        payment_method_types: ['card']
      }, {
        stripeAccount: stripeAccountId
      });
    } catch (error: any) {
      throw {
        code: 'STRIPE_ERROR',
        message: 'Error al procesar el cargo',
        details: {
          type: error.type,
          code: error.code,
          message: error.message
        }
      };
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    attempt = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt >= this.MAX_RETRY_ATTEMPTS || !this.isRetryableError(error)) {
        throw error;
      }

      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      return this.retryOperation(operation, attempt + 1);
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      'rate_limit_exceeded',
      'timeout',
      'connection_error',
      'api_error'
    ];

    return retryableCodes.includes(error.code);
  }

  private async recordPayment({
    bookingId,
    amount,
    paymentIntentId,
    reason,
    status
  }: {
    bookingId: string;
    amount: number;
    paymentIntentId: string;
    reason?: string;
    status: string;
  }) {
    const { error } = await this.supabase
      .from('bookings_payments')
      .insert({
        booking_id: bookingId,
        amount,
        type: 'no_show_charge',
        status: status === 'succeeded' ? 'completed' : 'failed',
        stripe_payment_intent_id: paymentIntentId,
        notes: reason || 'Cargo por no-show'
      });

    if (error) {
      throw {
        code: 'RECORD_ERROR',
        message: 'Error al registrar el pago',
        details: error
      };
    }
  }

  private async updateBookingStatus(
    bookingId: string,
    {
      status,
      reason,
      chargeApplied
    }: {
      status: string;
      reason?: string;
      chargeApplied: boolean;
    }
  ) {
    const { error } = await this.supabase
      .from('bookings')
      .update({
        status,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        no_show_charge_applied: chargeApplied
      })
      .eq('id', bookingId);

    if (error) {
      throw {
        code: 'UPDATE_ERROR',
        message: 'Error al actualizar el estado de la reserva',
        details: error
      };
    }
  }

  private async logError(
    error: any,
    context: {
      requestId: string;
      bookingId: string;
      type: string;
    }
  ) {
    try {
      const errorLog = {
        type: 'stripe_payment_error' as const,
        error_message: error.message,
        metadata: {
          ...context,
          error_details: {
            code: error.code,
            type: error.type,
            details: error.details
          }
        }
      };

      await this.supabase
        .from('error_logs')
        .insert(errorLog);
    } catch (logError) {
      console.error('Error al registrar error:', logError);
    }
  }
} 