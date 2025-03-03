import { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { createId } from '@paralleldrive/cuid2';
import type { Database } from '@/types/supabase';

// Mapeo de tipos de pago de UI a tipos válidos en la base de datos
const PAYMENT_TYPE_MAPPING: Record<string, string> = {
  'full': 'booking',  // Mapeo explícito de "full" a "booking"
  'guarantee': 'guarantee',
  'deposit': 'deposit',
  'remaining': 'remaining',
  'no_show_charge': 'no_show_charge'
};

interface FullPaymentRequest {
  bookingId: string;
  amount: number;
  stripePaymentMethodId: string;
  stripeAccountId: string;
  stripeCustomerId: string;
  empresaId: string;
  description?: string;
  paymentType?: string;
  paymentMethod?: string;
}

interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  chargeStatus?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class FullPaymentService {
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor(
    private stripe: Stripe,
    private supabase: SupabaseClient<Database>
  ) {}

  /**
   * Procesa el pago completo de una reserva
   */
  async processFullPayment(params: FullPaymentRequest): Promise<PaymentResult> {
    const requestId = createId();
    console.log(`🔄 [${requestId}] Iniciando proceso de cobro completo:`, {
      bookingId: params.bookingId,
      amount: params.amount,
      empresaId: params.empresaId,
      paymentType: params.paymentType || 'full',
      timestamp: new Date().toISOString()
    });

    try {
      // Determinar el tipo de pago a usar en la BD
      const dbPaymentType = params.paymentType 
        ? (PAYMENT_TYPE_MAPPING[params.paymentType] || 'booking')
        : 'booking';
        
      console.log(`🔄 [${requestId}] Tipo de pago mapeado:`, {
        original: params.paymentType || 'full',
        mapped: dbPaymentType
      });
        
      // 1. Procesar el cargo a través de Stripe
      const paymentIntent = await this.createPaymentIntent({
        amount: params.amount,
        customerId: params.stripeCustomerId,
        paymentMethodId: params.stripePaymentMethodId,
        accountId: params.stripeAccountId,
        metadata: {
          booking_id: params.bookingId,
          payment_type: dbPaymentType, // Usar tipo "booking" válido en la BD
          description: params.description || 'Pago completo de reserva'
        }
      });

      // 2. Registrar el pago en la base de datos
      if (paymentIntent.status === 'succeeded') {
        await this.registerPaymentInDatabase({
          bookingId: params.bookingId,
          amount: params.amount,
          paymentIntentId: paymentIntent.id,
          status: 'completed',
          description: params.description || 'Pago completo de reserva',
          paymentType: dbPaymentType
        });

        // 3. Actualizar el estado de la reserva a 'confirmed' y el estado de pago a 'completed'
        await this.updateBookingStatus(params.bookingId, 'confirmed');
      }

      return {
        success: paymentIntent.status === 'succeeded',
        paymentIntentId: paymentIntent.id,
        chargeStatus: paymentIntent.status
      };
    } catch (error: any) {
      console.error(`❌ [${requestId}] Error en processFullPayment:`, error);
      
      // Registrar el error para análisis posterior
      await this.logError(error, {
        requestId,
        bookingId: params.bookingId,
        type: 'full_payment_error'
      });
      
      return {
        success: false,
        error: {
          code: error.code || 'PAYMENT_ERROR',
          message: error.message || 'Error al procesar el pago completo',
          details: error.details || error
        }
      };
    }
  }

  /**
   * Crea un PaymentIntent en Stripe y lo confirma inmediatamente
   */
  private async createPaymentIntent({
    amount,
    customerId,
    paymentMethodId,
    accountId,
    metadata
  }: {
    amount: number;
    customerId: string;
    paymentMethodId: string;
    accountId: string;
    metadata: Record<string, any>;
  }) {
    const requestId = createId();
    console.log(`🔄 [${requestId}] Creando PaymentIntent:`, {
      amount,
      customerId,
      hasPaymentMethod: Boolean(paymentMethodId),
      paymentType: metadata.payment_type,
      timestamp: new Date().toISOString()
    });

    try {
      // Usar retryOperation para intentar nuevamente en caso de errores temporales
      return await this.retryOperation(async () => {
        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convertir a céntimos
          currency: 'eur',
          customer: customerId,
          payment_method: paymentMethodId,
          off_session: true,
          confirm: true,
          payment_method_types: ['card'],
          metadata: {
            ...metadata,
            request_id: requestId
          },
          description: metadata.description || 'Pago completo de reserva',
          confirmation_method: 'automatic',
          capture_method: 'automatic'
        }, {
          stripeAccount: accountId,
          idempotencyKey: `full_payment_${metadata.booking_id}_${Date.now()}`
        });

        console.log(`✅ [${requestId}] PaymentIntent creado:`, {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          paymentType: metadata.payment_type
        });

        return paymentIntent;
      });
    } catch (error: any) {
      console.error(`❌ [${requestId}] Error al crear PaymentIntent:`, error);

      // Transformar errores de Stripe en errores más legibles
      if (error.code === 'authentication_required') {
        throw {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'La tarjeta requiere autenticación',
          details: {
            payment_intent_id: error.payment_intent?.id,
            type: error.type
          }
        };
      }

      if (error.code === 'card_declined') {
        throw {
          code: 'CARD_DECLINED',
          message: 'La tarjeta fue rechazada',
          details: {
            decline_code: error.decline_code,
            type: error.type
          }
        };
      }

      throw {
        code: 'STRIPE_ERROR',
        message: error.message || 'Error al procesar el pago',
        details: {
          type: error.type,
          code: error.code
        }
      };
    }
  }

  /**
   * Registra el pago en la base de datos
   */
  private async registerPaymentInDatabase({
    bookingId,
    amount,
    paymentIntentId,
    status,
    description,
    paymentType = 'booking'
  }: {
    bookingId: string;
    amount: number;
    paymentIntentId: string;
    status: 'pending' | 'completed' | 'failed';
    description?: string;
    paymentType?: string;
  }) {
    try {
      const { error } = await this.supabase
        .from('payments')
        .insert({
          booking_id: bookingId,
          deposit_amount: amount,
          total_price: amount,
          payment_method: 'stripe',
          payment_status: status,
          payment_type: paymentType,
          stripe_payment_intent_id: paymentIntentId,
          notes: description || 'Pago completo de reserva'
        } as any);

      if (error) {
        console.error('Error al registrar pago en la base de datos:', error);
        throw {
          code: 'DATABASE_ERROR',
          message: 'Error al registrar el pago en la base de datos',
          details: error
        };
      }
    } catch (error) {
      console.error('Error inesperado al registrar pago:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de la reserva
   */
  private async updateBookingStatus(
    bookingId: string,
    status: 'pending' | 'confirmed' | 'cancelled'
  ) {
    try {
      const { error } = await this.supabase
        .from('bookings')
        .update({
          status,
          payment_status: status === 'confirmed' ? 'completed' : 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error al actualizar estado de la reserva:', error);
        throw {
          code: 'DATABASE_ERROR',
          message: 'Error al actualizar el estado de la reserva',
          details: error
        };
      }
    } catch (error) {
      console.error('Error inesperado al actualizar reserva:', error);
      throw error;
    }
  }

  /**
   * Registra un error en la base de datos
   */
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
        type: 'payment_error' as const,
        error_message: error.message || JSON.stringify(error),
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

  /**
   * Método utilitario para reintentar operaciones
   */
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

  /**
   * Determina si un error puede ser reintentado
   */
  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      'rate_limit_exceeded',
      'timeout',
      'connection_error',
      'api_error'
    ];

    return retryableCodes.includes(error.code);
  }
} 