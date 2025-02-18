import { Database } from '@/types/supabase'
import { SupabaseClient } from '@supabase/supabase-js'
import { createId } from '@paralleldrive/cuid2'

export type ValidationErrorCode = 
  | 'BOOKING_NOT_FOUND'
  | 'BOOKING_ALREADY_CANCELLED'
  | 'BOOKING_NOT_CANCELLED'
  | 'INVALID_AMOUNT'
  | 'STRIPE_ACCOUNT_NOT_FOUND'
  | 'STRIPE_ACCOUNT_NOT_ACTIVE'
  | 'STRIPE_CUSTOMER_NOT_FOUND'
  | 'STRIPE_CUSTOMER_INACTIVE'
  | 'NO_PAYMENT_METHOD'
  | 'INSUFFICIENT_PERMISSIONS'

export interface ValidationError {
  code: ValidationErrorCode
  message: string
  field?: string
  details?: Record<string, any>
}

export interface ValidationResult<T = any> {
  isValid: boolean
  errors: ValidationError[]
  data?: T
  context?: Record<string, any>
}

export interface BookingValidationContext {
  booking: Database['public']['Tables']['bookings']['Row']
  empresa_id: string
  user_id: string
}

export interface StripeAccountValidationContext {
  stripe_connection: Database['public']['Tables']['stripe_connections']['Row']
  account_status: string
  charges_enabled: boolean
}

export interface StripeCustomerValidationContext {
  stripe_customer: Database['public']['Tables']['stripe_customers']['Row']
  payment_methods_count: number
}

export interface NoShowChargeValidationContext {
  booking: BookingValidationContext['booking']
  stripe_connection: StripeAccountValidationContext['stripe_connection']
  stripe_customer: StripeCustomerValidationContext['stripe_customer']
  amount: number
}

export class ValidationService {
  constructor(
    private readonly supabase: SupabaseClient<Database>
  ) {}

  async validateNoShowCharge(
    empresa_id: string,
    booking_id: string,
    amount: number
  ): Promise<ValidationResult<NoShowChargeValidationContext>> {
    const requestId = createId();
    console.log(`🔄 [${requestId}] Iniciando validación de cargo no-show:`, {
      empresa_id,
      booking_id,
      amount
    });

    const errors: ValidationError[] = []
    const context: Partial<NoShowChargeValidationContext> = {}

    // 1. Validar la reserva
    console.log(`📋 [${requestId}] Validando reserva...`);
    const bookingResult = await this.validateBooking(booking_id, empresa_id)
    if (!bookingResult.isValid) {
      console.warn(`⚠️ [${requestId}] Validación de reserva fallida:`, bookingResult.errors);
      return {
        isValid: false,
        errors: bookingResult.errors,
        context: bookingResult.context
      }
    }
    context.booking = bookingResult.data!
    console.log(`✅ [${requestId}] Reserva validada correctamente`);

    // 2. Validar la cuenta de Stripe
    console.log(`💳 [${requestId}] Validando cuenta Stripe...`);
    const stripeAccountResult = await this.validateStripeAccount(empresa_id)
    if (!stripeAccountResult.isValid) {
      console.warn(`⚠️ [${requestId}] Validación de cuenta Stripe fallida:`, stripeAccountResult.errors);
      return {
        isValid: false,
        errors: stripeAccountResult.errors,
        context: { ...context, ...stripeAccountResult.context }
      }
    }
    context.stripe_connection = stripeAccountResult.data!
    console.log(`✅ [${requestId}] Cuenta Stripe validada correctamente`);

    // 3. Validar el cliente de Stripe
    console.log(`👤 [${requestId}] Validando cliente Stripe...`);
    const stripeCustomerResult = await this.validateStripeCustomer(
      context.booking.user_id,
      context.stripe_connection.stripe_account_id
    )
    if (!stripeCustomerResult.isValid) {
      console.warn(`⚠️ [${requestId}] Validación de cliente Stripe fallida:`, stripeCustomerResult.errors);
      return {
        isValid: false,
        errors: stripeCustomerResult.errors,
        context: { ...context, ...stripeCustomerResult.context }
      }
    }
    context.stripe_customer = stripeCustomerResult.data!
    console.log(`✅ [${requestId}] Cliente Stripe validado correctamente`);

    // 4. Validar el monto
    console.log(`💰 [${requestId}] Validando monto...`);
    const amountResult = this.validateAmount(amount, context.booking.total_price)
    if (!amountResult.isValid) {
      console.warn(`⚠️ [${requestId}] Validación de monto fallida:`, amountResult.errors);
      return {
        isValid: false,
        errors: [...errors, ...amountResult.errors],
        context
      }
    }
    context.amount = amount
    console.log(`✅ [${requestId}] Monto validado correctamente`);

    console.log(`🎉 [${requestId}] Todas las validaciones completadas con éxito`);
    return {
      isValid: true,
      errors: [],
      data: context as NoShowChargeValidationContext,
      context
    }
  }

  private async validateBooking(
    booking_id: string,
    empresa_id: string
  ): Promise<ValidationResult<Database['public']['Tables']['bookings']['Row']>> {
    const { data: booking, error } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .eq('empresa_id', empresa_id)
      .single()

    if (error || !booking) {
      return {
        isValid: false,
        errors: [{
          code: 'BOOKING_NOT_FOUND',
          message: 'La reserva no existe o no tienes permisos para acceder a ella'
        }]
      }
    }

    if (booking.cancelled_at === null) {
      return {
        isValid: false,
        errors: [{
          code: 'BOOKING_NOT_CANCELLED',
          message: 'La reserva debe estar cancelada para poder realizar un cargo por no presentarse'
        }],
        context: { booking }
      }
    }

    return {
      isValid: true,
      errors: [],
      data: booking,
      context: { booking }
    }
  }

  private async validateStripeAccount(
    empresa_id: string
  ): Promise<ValidationResult<Database['public']['Tables']['stripe_connections']['Row']>> {
    const { data: stripeConnection, error } = await this.supabase
      .from('stripe_connections')
      .select('*')
      .eq('empresa_id', empresa_id)
      .single()

    if (error || !stripeConnection) {
      return {
        isValid: false,
        errors: [{
          code: 'STRIPE_ACCOUNT_NOT_FOUND',
          message: 'No se encontró una cuenta de Stripe conectada para esta empresa'
        }]
      }
    }

    if (stripeConnection.account_status !== 'active' || !stripeConnection.charges_enabled) {
      return {
        isValid: false,
        errors: [{
          code: 'STRIPE_ACCOUNT_NOT_ACTIVE',
          message: 'La cuenta de Stripe no está activa o no tiene los cargos habilitados'
        }],
        context: { stripe_connection: stripeConnection }
      }
    }

    return {
      isValid: true,
      errors: [],
      data: stripeConnection,
      context: { stripe_connection: stripeConnection }
    }
  }

  private async validateStripeCustomer(
    user_id: string,
    stripe_account_id: string
  ): Promise<ValidationResult<Database['public']['Tables']['stripe_customers']['Row']>> {
    const { data: stripeCustomer, error } = await this.supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', user_id)
      .eq('stripe_account_id', stripe_account_id)
      .single()

    if (error || !stripeCustomer) {
      return {
        isValid: false,
        errors: [{
          code: 'STRIPE_CUSTOMER_NOT_FOUND',
          message: 'No se encontró un cliente de Stripe para este usuario'
        }]
      }
    }

    if (stripeCustomer.status !== 'active') {
      return {
        isValid: false,
        errors: [{
          code: 'STRIPE_CUSTOMER_INACTIVE',
          message: 'El cliente de Stripe no está activo'
        }],
        context: { stripe_customer: stripeCustomer }
      }
    }

    if (stripeCustomer.payment_methods_count === 0) {
      return {
        isValid: false,
        errors: [{
          code: 'NO_PAYMENT_METHOD',
          message: 'El cliente no tiene métodos de pago registrados'
        }],
        context: { stripe_customer: stripeCustomer }
      }
    }

    return {
      isValid: true,
      errors: [],
      data: stripeCustomer,
      context: { stripe_customer: stripeCustomer }
    }
  }

  private validateAmount(
    amount: number,
    totalPrice: number
  ): ValidationResult<number> {
    if (amount <= 0) {
      return {
        isValid: false,
        errors: [{
          code: 'INVALID_AMOUNT',
          message: 'El monto debe ser mayor a 0',
          field: 'amount'
        }]
      }
    }

    if (amount > totalPrice) {
      return {
        isValid: false,
        errors: [{
          code: 'INVALID_AMOUNT',
          message: 'El monto no puede ser mayor al precio total de la reserva',
          field: 'amount',
          details: { totalPrice }
        }]
      }
    }

    return {
      isValid: true,
      errors: [],
      data: amount
    }
  }
} 