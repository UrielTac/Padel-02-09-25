export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  name: string;
  description: string;
  type: 'card' | 'cash' | 'transfer';
}

export interface Coupon {
  code: string;
  discount: number;
  type: 'fixed' | 'percentage';
  description: string;
}

export interface GuaranteeConfig {
  percentage: number;
}

export interface PaymentType {
  id: string;
  name: string;
  description: string;
  config?: PaymentConfig;
}

export const PAYMENT_TYPES: PaymentType[] = [
  {
    id: 'card',
    name: 'Tarjeta de crédito/débito',
    description: 'Pago seguro con tarjeta',
    icon: 'credit-card',
    details: ['Pago seguro con tarjeta']
  },
  {
    id: 'cash',
    name: 'Efectivo',
    description: 'Pago en efectivo al llegar',
    icon: 'cash',
    details: ['Pago en efectivo al llegar']
  },
  {
    id: 'club',
    name: 'Pago en el Club',
    description: 'Pagar al llegar al club',
    details: ['Realiza el pago directamente en las instalaciones del club']
  },
  {
    id: 'full',
    name: 'Pago Completo',
    description: 'Pagar el monto total de la reserva',
    details: ['Realiza el pago completo ahora y asegura tu reserva inmediatamente']
  },
  {
    id: 'advance',
    name: 'Pago con Seña',
    description: 'Pagar solo la seña ahora',
    details: ['Paga una seña del 30% ahora y el resto al llegar al club']
  },
  {
    id: 'guarantee',
    name: 'Garantía',
    description: 'Dejar tarjeta como garantía',
    details: [
      'Se solicitarán los datos de tu tarjeta como garantía',
      'No se realizará ningún cargo inmediato',
      'En caso de no presentarse, se realizará un cargo del porcentaje establecido'
    ],
    requiresCard: true,
    guaranteeConfig: {
      percentage: 30
    }
  }
];

export interface Calculations {
  selectedItems: SelectedItem[];
  courtPrice: number;
  itemsTotal: number;
  subtotal: number;
  discount: number;
  total: number;
}

export interface SummaryState {
  showItemsDetails: boolean;
  showPaymentMethods: boolean;
  showPaymentTypes: boolean;
  showCouponsPanel: boolean;
  couponCode: string;
  couponError: string | null;
  appliedCoupon: Coupon | null;
  selectedPaymentMethod: PaymentMethod | null;
  selectedPaymentType: string | null;
  guaranteeConfig: {
    percentage: number;
  };
  calculations: Calculations;
}

export interface PaymentConfig {
  paymentMethodId?: string;
  requiresCard?: boolean;
  requiresValidation?: boolean;
}

export interface PaymentTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  viewType: "mobile" | "desktop";
  onSelect: (type: string, config?: PaymentConfig) => void;
  isPublicView?: boolean;
  onShowCardModal?: () => void;
}

export interface SelectedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface StripeValidationResult {
  success: boolean;
  error?: string;
  paymentMethodId?: string;
}

export interface BookingValidation {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
} 