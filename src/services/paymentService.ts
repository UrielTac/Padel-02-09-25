import { getAuthenticatedSupabaseClient } from '@/lib/supabase/client'
import type { PaymentMethod } from '@/types/payments'
import { createId } from '@paralleldrive/cuid2'
import type { Database } from '@/types/supabase'

interface RegisterPaymentParams {
  bookingId: string
  depositAmount: number
  paymentMethod: string
  notes?: string
}

interface PaymentResponse {
  success: boolean
  payment_id?: string
  new_status?: string
  total_paid?: number
  error?: string
}

interface StripePaymentData {
  paymentMethodId: string;
  accountId: string;
  customerId?: string | null;
}

export const paymentService = {
  async getPaymentMethods() {
    const { client } = await getAuthenticatedSupabaseClient()
    const { data, error } = await client
      .from('payment_methods')
      .select('*')
      .order('name')

    if (error) throw error
    return data as PaymentMethod[]
  },

  async createPayment(data: any) {
    const { client } = await getAuthenticatedSupabaseClient()
    const { data: payment, error } = await client
      .from('payments')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return payment
  },

  async registerPayment({
    bookingId,
    depositAmount,
    paymentMethod,
    notes
  }: RegisterPaymentParams): Promise<PaymentResponse> {
    try {
      const { client } = await getAuthenticatedSupabaseClient()
      const { data, error } = await client
        .rpc('register_booking_payment', {
          p_booking_id: bookingId,
          p_deposit_amount: depositAmount,
          p_payment_method: paymentMethod,
          p_notes: notes
        })

      if (error) throw error

      return {
        success: true,
        payment_id: data?.payment_id,
        new_status: data?.new_status,
        total_paid: data?.total_paid
      }
    } catch (error) {
      console.error('Error registering payment:', error)
      return {
        success: false,
        error: 'Error al procesar el pago'
      }
    }
  },

  async getStripePaymentMethodId(bookingId: string): Promise<string | null> {
    try {
      const { client, userId } = await getAuthenticatedSupabaseClient()
      console.log('🔍 Buscando payment_method_id para booking:', {
        booking_id: bookingId,
        userId,
        timestamp: new Date().toISOString()
      });
      
      // 1. Intentar obtener el pago más reciente con stripe_payment_method_id
      const { data: payments, error } = await client
        .from('payments')
        .select('stripe_payment_method_id, payment_method, created_at')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error al consultar payments:', {
          error,
          booking_id: bookingId,
          userId
        });
        return null;
      }

      // 2. Filtrar y obtener el primer pago con stripe_payment_method_id
      const validPayment = payments?.find(payment => 
        payment.payment_method === 'stripe' && 
        payment.stripe_payment_method_id
      );

      console.log('✅ Resultado búsqueda payment_method_id:', {
        booking_id: bookingId,
        userId,
        found: Boolean(validPayment),
        total_payments: payments?.length,
        payment_method_id: validPayment?.stripe_payment_method_id,
        timestamp: new Date().toISOString()
      });

      return validPayment?.stripe_payment_method_id || null;
    } catch (error) {
      console.error('❌ Error inesperado al obtener stripe_payment_method_id:', {
        error,
        booking_id: bookingId,
        timestamp: new Date().toISOString()
      });
      return null;
    }
  },

  async getStripePaymentData(bookingId: string, isServer = false): Promise<StripePaymentData | null> {
    const requestId = createId();
    try {
      // Usar el cliente apropiado según el contexto
      const client = isServer 
        ? createServerComponentClient<Database>({ cookies })
        : (await getAuthenticatedSupabaseClient()).client;

      console.log(`🔍 [${requestId}] Iniciando búsqueda de datos Stripe:`, {
        bookingId,
        context: isServer ? 'server' : 'client',
        timestamp: new Date().toISOString()
      });
      
      // 1. Obtener la reserva con sus pagos y participante principal
      const { data: booking, error: bookingError } = await client
        .from('bookings')
        .select(`
          id,
          empresa_id,
          payments (
            id,
            stripe_payment_method_id,
            payment_method,
            created_at
          ),
          booking_participants!inner (
            user_id,
            role
          )
        `)
        .eq('id', bookingId)
        .eq('booking_participants.role', 'player')
        .single();

      if (bookingError) {
        console.error(`❌ [${requestId}] Error al obtener booking:`, {
          error: bookingError,
          bookingId,
          context: isServer ? 'server' : 'client'
        });
        return null;
      }

      if (!booking) {
        console.log(`⚠️ [${requestId}] No se encontró la reserva:`, {
          bookingId,
          context: isServer ? 'server' : 'client'
        });
        return null;
      }

      // 2. Obtener el customer de Stripe con su account_id
      const { data: stripeCustomer, error: customerError } = await client
        .from('stripe_customers')
        .select('stripe_customer_id, stripe_account_id, status')
        .eq('user_id', booking.booking_participants[0].user_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (customerError) {
        console.error(`❌ [${requestId}] Error al obtener stripe_customer:`, {
          error: customerError,
          userId: booking.booking_participants[0].user_id,
          bookingId,
          context: isServer ? 'server' : 'client'
        });
        return null;
      }

      // Validación específica para cliente Stripe no encontrado
      if (!stripeCustomer) {
        console.log(`⚠️ [${requestId}] No existe cliente Stripe para el usuario:`, {
          userId: booking.booking_participants[0].user_id,
          bookingId,
          context: isServer ? 'server' : 'client'
        });
        return null;
      }

      // Validación de campos requeridos
      if (!stripeCustomer.stripe_customer_id || !stripeCustomer.stripe_account_id) {
        console.log(`⚠️ [${requestId}] Cliente Stripe incompleto:`, {
          userId: booking.booking_participants[0].user_id,
          hasCustomerId: Boolean(stripeCustomer.stripe_customer_id),
          hasAccountId: Boolean(stripeCustomer.stripe_account_id),
          status: stripeCustomer.status,
          context: isServer ? 'server' : 'client'
        });
        return null;
      }

      // 3. Obtener el payment_method_id del pago más reciente con Stripe
      const validPayment = booking.payments
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        ?.find(payment => 
          payment.payment_method === 'stripe' && 
          payment.stripe_payment_method_id
        );

      if (!validPayment?.stripe_payment_method_id) {
        console.log(`⚠️ [${requestId}] No se encontró método de pago válido:`, {
          bookingId,
          userId: booking.booking_participants[0].user_id,
          paymentsCount: booking.payments?.length,
          hasStripePayments: booking.payments?.some(p => p.payment_method === 'stripe'),
          context: isServer ? 'server' : 'client'
        });
        return null;
      }

      // 4. Construir y validar respuesta
      const response = {
        paymentMethodId: validPayment.stripe_payment_method_id,
        accountId: stripeCustomer.stripe_account_id,
        customerId: stripeCustomer.stripe_customer_id
      };

      console.log(`✅ [${requestId}] Datos de Stripe completos:`, {
        bookingId,
        userId: booking.booking_participants[0].user_id,
        response,
        context: isServer ? 'server' : 'client',
        timestamp: new Date().toISOString()
      });

      return response;

    } catch (error) {
      console.error(`❌ [${requestId}] Error inesperado al obtener datos de Stripe:`, {
        error,
        bookingId,
        context: isServer ? 'server' : 'client',
        timestamp: new Date().toISOString()
      });
      return null;
    }
  },

  /**
   * Procesa un pago completo para una reserva utilizando la tarjeta seleccionada
   * @param bookingId ID de la reserva
   * @param paymentMethodId ID del método de pago (tarjeta)
   * @param amount Monto total a cobrar
   * @returns Resultado del pago
   */
  async processFullPayment(params: {
    bookingId: string;
    paymentMethodId: string;
    amount: number;
    description?: string;
    paymentType?: string;
  }): Promise<{
    success: boolean;
    paymentIntentId?: string;
    message?: string;
    error?: any;
  }> {
    try {
      const { bookingId, paymentMethodId, amount, description, paymentType = 'full' } = params;
      
      console.log('🔄 Iniciando procesamiento de pago completo:', {
        bookingId,
        paymentMethodId,
        amount,
        paymentType,
        timestamp: new Date().toISOString()
      });

      // 1. Obtener los datos necesarios para procesar el pago con Stripe
      const stripeData = await this.getStripePaymentData(bookingId);
      
      if (!stripeData) {
        console.error('❌ No se pudieron obtener los datos de Stripe para la reserva:', bookingId);
        return {
          success: false,
          message: 'No se pudieron obtener los datos de pago'
        };
      }

      // Mapeo de tipos de pago para asegurar compatibilidad con la BD
      const dbPaymentType = paymentType === 'full' ? 'booking' : paymentType;

      console.log('🔄 Tipo de pago mapeado para API:', {
        original: paymentType,
        mapped: dbPaymentType
      });

      // 3. Procesar el pago a través de la API
      const response = await fetch('/api/stripe/process-full-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          amount,
          stripePaymentMethodId: paymentMethodId,
          stripeAccountId: stripeData.accountId,
          stripeCustomerId: stripeData.customerId,
          description: description || 'Pago completo de reserva',
          paymentType: dbPaymentType,
          paymentMethod: 'stripe'
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ Error al procesar el pago completo:', result.error);
        return {
          success: false,
          message: result.error?.message || 'Error al procesar el pago',
          error: result.error
        };
      }

      console.log('✅ Pago completo procesado exitosamente:', {
        bookingId,
        paymentIntentId: result.paymentIntentId,
        status: result.chargeStatus,
        type: dbPaymentType
      });

      return {
        success: true,
        paymentIntentId: result.paymentIntentId,
        message: 'Pago procesado exitosamente'
      };
    } catch (error: any) {
      console.error('❌ Error inesperado al procesar pago completo:', error);
      return {
        success: false,
        message: error.message || 'Error inesperado al procesar el pago',
        error
      };
    }
  }
}