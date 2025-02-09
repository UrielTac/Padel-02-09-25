export interface PaymentMethod {
  id: string;
  name: string;
  icon: any; // TODO: Mejorar este tipo
  description: string;
}

export interface Coupon {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  description: string;
}

export interface GuaranteeConfig {
  percentage: number;
}

export interface PaymentType {
  id: string;
  name: string;
  description: string;
  details?: string[];
  requiresCard?: boolean;
  guaranteeConfig?: GuaranteeConfig;
}

export const PAYMENT_TYPES: PaymentType[] = [
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
  selectedItems: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }>;
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
  selectedPaymentMethod: string | null;
  selectedPaymentType: string | null;
  guaranteeConfig: GuaranteeConfig;
  calculations: Calculations;
} 