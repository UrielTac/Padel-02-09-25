import { useForm } from '@/contexts/FormContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';
import type { BookingCreationData, PaymentMethodEnum, PaymentTypeEnum } from '@/types/bookings';
import type { RentalSelection } from '@/types/items';
import { PAYMENT_TYPE_MAPPINGS } from '@/types/bookings';

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface UseBookingTransformerOptions {
  rentals: RentalSelection[];
  rentalItemsPrice: number;
}

export function useBookingTransformer({ 
  rentals, 
  rentalItemsPrice
}: UseBookingTransformerOptions) {
  const { state } = useForm();
  const { user } = useAuth();

  const validationErrors = useMemo(() => {
    const errors: ValidationError[] = [];

    // Validaciones críticas
    if (!user) {
      errors.push({
        field: 'auth',
        message: 'Usuario no autenticado',
        severity: 'error'
      });
    }

    if (!state.location.branchId) {
      errors.push({
        field: 'location',
        message: 'Sucursal no seleccionada',
        severity: 'error'
      });
    }

    if (!state.shift.courtId) {
      errors.push({
        field: 'court',
        message: 'Cancha no seleccionada',
        severity: 'error'
      });
    }

    if (!state.shift.date || !state.shift.startTime || !state.shift.endTime) {
      errors.push({
        field: 'shift',
        message: 'Horario no seleccionado',
        severity: 'error'
      });
    }

    // Validación exhaustiva del estado de pago
    console.log('Validando estado de pago:', {
      method: state.payment.method,
      type: state.payment.type,
      config: state.payment.config
    });

    if (!state.payment.method) {
      errors.push({
        field: 'payment',
        message: 'Selecciona un método de pago',
        severity: 'error'
      });
    }

    if (!state.payment.type) {
      errors.push({
        field: 'payment',
        message: 'Selecciona un tipo de pago',
        severity: 'error'
      });
    }

    // Validación específica para pagos con tarjeta
    if (state.payment.method === 'card') {
      if (!state.payment.config?.paymentMethodId) {
        errors.push({
          field: 'payment',
          message: 'Información de tarjeta incompleta: ID de método de pago faltante',
          severity: 'error'
        });
      }
      
      if (!state.payment.config?.brand || !state.payment.config?.last4) {
        errors.push({
          field: 'payment',
          message: 'Información de tarjeta incompleta: Detalles de tarjeta faltantes',
          severity: 'error'
        });
      }
    }

    // Validaciones específicas para garantía
    if (state.payment.type === 'guarantee') {
      if (!user?.metadata?.email) {
        errors.push({
          field: 'user',
          message: 'Se requiere un email válido para la garantía',
          severity: 'error'
        });
      }

      if (!user?.metadata?.phone) {
        errors.push({
          field: 'user',
          message: 'Se requiere un número de teléfono para la garantía',
          severity: 'warning'
        });
      }

      if (state.payment.method !== 'card') {
        errors.push({
          field: 'payment',
          message: 'La garantía requiere pago con tarjeta',
          severity: 'error'
        });
      }
    }

    // Validación de precios
    if (typeof state.shift.price !== 'number' || state.shift.price <= 0) {
      errors.push({
        field: 'price',
        message: 'Precio de cancha inválido',
        severity: 'error'
      });
    }

    return errors;
  }, [state.payment, user]);

  const transformedData = useMemo((): BookingCreationData | null => {
    if (validationErrors.some(error => error.severity === 'error')) {
      console.log('Errores de validación impiden la transformación:', validationErrors);
      return null;
    }

    // Obtener la configuración de pago según el tipo seleccionado
    const paymentType = state.payment.type as PaymentTypeEnum;
    const paymentMapping = PAYMENT_TYPE_MAPPINGS[paymentType];

    const paymentData = {
      paymentMethod: paymentMapping.defaultMethod,
      paymentStatus: paymentMapping.defaultStatus,
      paymentType: paymentType,
      depositAmount: 0
    };

    console.log('Datos de pago transformados:', paymentData);

    return {
      // Datos de la cancha
      courtId: state.shift.courtId!,
      date: state.shift.date!,
      startTime: state.shift.startTime!,
      endTime: state.shift.endTime!,
      courtPrice: state.shift.price || 0,

      // Datos de pago
      ...paymentData,

      // Datos de rentals
      rentalItems: rentals.map(rental => ({
        itemId: rental.itemId,
        quantity: rental.quantity,
        pricePerUnit: rental.pricePerUnit,
        totalPrice: rental.totalPrice
      })),
      rentalItemsPrice,

      // Datos de participantes
      participants: [{
        id: user!.id,
        memberId: user!.id,
        role: 'player',
        firstName: user!.metadata.name?.split(' ')[0] || '',
        lastName: user!.metadata.name?.split(' ').slice(1).join(' ') || '',
        name: user!.metadata.name || '',
        email: user!.metadata.email,
        phone: user!.metadata.phone
      }]
    };
  }, [state, user, rentals, rentalItemsPrice, validationErrors]);

  return {
    transformedData,
    isValid: !validationErrors.some(error => error.severity === 'error'),
    validationErrors,
    isReady: !!user && !!state.location.branchId && !!state.shift.courtId,
    hasWarnings: validationErrors.some(error => error.severity === 'warning')
  };
} 