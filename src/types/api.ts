// Tipos para el endpoint de cargo por no-show
export interface NoShowChargeRequest {
  bookingId: string;
  amount: number;
  stripeAccountId: string;
  reason?: string;
  empresaId: string;
}

export interface NoShowChargeResponse {
  success: boolean;
  paymentIntentId?: string;
  chargeStatus?: string;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface NoShowChargeError {
  type: string;
  code: string;
  message: string;
  decline_code?: string;
} 