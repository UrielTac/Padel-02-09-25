import { createSupabaseClient } from '@/lib/supabase'
import type { PaymentMethod } from '@/types/payments'

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

export const paymentService = {
  async getPaymentMethods() {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('name')

    if (error) throw error
    return data as PaymentMethod[]
  },

  async createPayment(data: any) {
    const supabase = createSupabaseClient()
    const { data: payment, error } = await supabase
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
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .rpc('register_booking_payment', {
          p_booking_id: bookingId,
          p_deposit_amount: depositAmount,
          p_payment_method: paymentMethod,
          p_notes: notes
        })

      if (error) throw error

      return data as PaymentResponse
    } catch (error) {
      console.error('Error registering payment:', error)
      return {
        success: false,
        error: 'Error al procesar el pago'
      }
    }
  }
}