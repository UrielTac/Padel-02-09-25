import type { Database } from './supabase'

export type PaymentMethod = Database['public']['Tables']['payment_methods']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']

export interface CreatePaymentData {
  booking_id: string
  amount: number
  payment_method: string
  status: 'pending' | 'completed' | 'failed'
  notes?: string
} 