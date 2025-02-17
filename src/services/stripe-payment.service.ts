import { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { createId } from '@paralleldrive/cuid2';
import type { NoShowChargeRequest } from '@/types/api';

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
  constructor(
    private stripe: Stripe,
    private supabase: SupabaseClient
  ) {}

  async chargeNoShow({
    bookingId,
    amount,
    reason,
    stripeAccountId
  }: NoShowChargeRequest): Promise<PaymentResult> {
    const requestId = createId();
    console.log(`🔄 [${requestId}] Iniciando proceso de cargo por no-show:`, {
      bookingId,
      amount
    });

    try {
      // 1. Verificar la reserva y su elegibilidad
      const booking = await this.validateBooking(bookingId);
      
      // 2. Obtener método de pago
      const paymentMethod = await this.getPaymentMethod(bookingId);

      // 3. Procesar cargo
      const paymentIntent = await this.processCharge({
        amount,
        paymentMethodId: paymentMethod.stripe_payment_method_id,
        stripeAccountId,
        metadata: {
          booking_id: bookingId,
          charge_type: 'no_show',
          reason: reason || 'No show charge'
        }
      });

      // 4. Registrar el cargo
      await this.recordPayment({
        bookingId,
        amount,
        paymentIntentId: paymentIntent.id,
        reason,
        status: paymentIntent.status
      });

      // 5. Actualizar estado de reserva
      await this.updateBookingStatus(bookingId, {
        status: 'cancelled',
        reason,
        chargeApplied: true
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

  private async validateBooking(bookingId: string) {
    const { data: booking, error } = await this.supabase
      .from('bookings')
      .select(`
        id,
        payment_type,
        payment_status,
        total_price,
        empresa_id,
        cancelled_at
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      throw {
        code: 'BOOKING_NOT_FOUND',
        message: 'Reserva no encontrada'
      };
    }

    if (booking.cancelled_at) {
      throw {
        code: 'ALREADY_CANCELLED',
        message: 'La reserva ya está cancelada'
      };
    }

    if (booking.payment_type !== 'guarantee') {
      throw {
        code: 'NO_GUARANTEE',
        message: 'La reserva no tiene garantía configurada'
      };
    }

    return booking;
  }

  private async getPaymentMethod(bookingId: string) {
    const { data: paymentMethod, error } = await this.supabase
      .from('stripe_payment_methods')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (error || !paymentMethod) {
      throw {
        code: 'PAYMENT_METHOD_NOT_FOUND',
        message: 'No se encontró un método de pago válido'
      };
    }

    return paymentMethod;
  }

  private async processCharge({
    amount,
    paymentMethodId,
    stripeAccountId,
    metadata
  }: {
    amount: number;
    paymentMethodId: string;
    stripeAccountId: string;
    metadata: Record<string, any>;
  }) {
    try {
      return await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'eur',
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        metadata
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
      status: 'cancelled';
      reason?: string;
      chargeApplied: boolean;
    }
  ) {
    const { error } = await this.supabase
      .from('bookings')
      .update({
        payment_status: status,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      throw {
        code: 'UPDATE_ERROR',
        message: 'Error al actualizar la reserva',
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
      await this.supabase
        .from('error_logs')
        .insert({
          type: 'stripe_payment_error',
          error_message: error.message,
          metadata: {
            ...context,
            error_details: {
              code: error.code,
              type: error.type,
              details: error.details
            }
          }
        });
    } catch (logError) {
      console.error('Error al registrar error:', logError);
    }
  }
} 