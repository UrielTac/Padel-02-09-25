import { useForm } from '@/contexts/FormContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';
import type { BookingCreationData, PaymentMethodEnum, PaymentTypeEnum, ParticipantRoleEnum } from '@/types/bookings';
import type { RentalSelection } from '@/types/items';
import { PAYMENT_TYPE_MAPPINGS } from '@/types/bookings';
import { useRentalContext } from '@/contexts/RentalContext';

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
  const { validateRental, calculateTotalPrice } = useRentalContext();

  // Transformar los items seleccionados del formulario
  const transformedRentals = useMemo(() => {
    // Obtener los items seleccionados de calculations
    const selectedItems = rentals
      .filter(rental => state.items.selectedItems[rental.itemId] > 0)
      .map(rental => {
        const quantity = state.items.selectedItems[rental.itemId];
        const pricePerUnit = rental.price;
        const duration = state.shift.duration || 60; // Duración por defecto 1 hora
        const totalPrice = quantity * pricePerUnit;

        console.log('Transformando rental:', {
          itemId: rental.itemId,
          quantity,
          pricePerUnit,
          duration,
          totalPrice
        });

        const transformedRental: RentalSelection = {
          itemId: rental.itemId,
          quantity,
          pricePerUnit,
          duration,
          totalPrice,
          price: totalPrice // Mantener compatibilidad
        };

        // Validar el rental transformado
        if (!validateRental(transformedRental)) {
          console.error('Rental inválido después de transformación:', transformedRental);
          return null;
        }

        return transformedRental;
      })
      .filter((rental): rental is RentalSelection => rental !== null);

    console.log('Items transformados para DB:', selectedItems);
    return selectedItems;
  }, [state.items.selectedItems, rentals, state.shift.duration, validateRental]);

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
  }, [state.payment, user, state.location.branchId, state.shift]);

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

    // Usar los rentals transformados y validados
    const validatedRentals = transformedRentals.map(rental => ({
      itemId: rental.itemId,
      quantity: rental.quantity,
      pricePerUnit: rental.pricePerUnit,
      totalPrice: rental.totalPrice,
      duration: rental.duration
    }));

    console.log('Datos de pago transformados:', paymentData);
    console.log('Items rentados a transformar:', validatedRentals);

    const calculatedRentalItemsPrice = validatedRentals.reduce(
      (sum, rental) => sum + rental.totalPrice,
      0
    );

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
      rentalItems: validatedRentals,
      rentalItemsPrice: calculatedRentalItemsPrice,

      // Datos de participantes
      participants: [{
        id: user!.id,
        userId: user!.id,
        role: 'player' as ParticipantRoleEnum
      }]
    };
  }, [state, user, transformedRentals, validationErrors]);

  return {
    transformedData,
    isValid: !validationErrors.some(error => error.severity === 'error'),
    validationErrors,
    isReady: !!user && !!state.location.branchId && !!state.shift.courtId,
    hasWarnings: validationErrors.some(error => error.severity === 'warning')
  };
} 