import { PaymentMethodEnum, PaymentStatusEnum } from './bookings'

export interface Payment {
  id: string;
  booking_id: string;
  deposit_amount: number;
  total_price: number;
  payment_method: PaymentMethodEnum;
  payment_status: PaymentStatusEnum;
  stripe_payment_method_id?: string;
  stripe_account_id?: string;
  charge_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentInsert extends Omit<Payment, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
} 