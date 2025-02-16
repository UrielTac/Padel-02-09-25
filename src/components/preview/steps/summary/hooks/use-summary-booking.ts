import { useSummaryState } from './useSummaryState';
import { useCallback, useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { useForm } from '@/contexts/FormContext';
import { useAuth } from '@/contexts/AuthContext';
import { PAYMENT_TYPE_MAPPINGS, PaymentTypeEnum, ParticipantRoleEnum } from '@/types/bookings';
import { bookingService } from '@/services/bookingService';
import { useFormItems } from '@/contexts/FormItemsContext';

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface UseSummaryBookingOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useSummaryBooking(options: UseSummaryBookingOptions = {}) {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isConfigurationStep, setIsConfigurationStep] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const creationAttempted = useRef(false);
  const { setPayment, state } = useForm();
  const { user } = useAuth();
  const { rentals, selectedItems, totalPrice: formItemsPrice } = useFormItems();

  const {
    selectedPaymentMethod,
    selectedPaymentType,
    calculations
  } = useSummaryState();

  // Sincronizar el estado de pago con el contexto global
  useEffect(() => {
    if (selectedPaymentType) {
      console.log('Sincronizando estado de pago:', {
        type: selectedPaymentType,
        mapping: PAYMENT_TYPE_MAPPINGS[selectedPaymentType as PaymentTypeEnum]
      });
      
      setPayment({
        type: selectedPaymentType as PaymentTypeEnum,
        method: null
      });

      console.log('Estado actual después de actualización:', {
        payment: state.payment,
        mapping: PAYMENT_TYPE_MAPPINGS[selectedPaymentType as PaymentTypeEnum]
      });
    }
  }, [selectedPaymentType, setPayment, state]);

  // Validar la configuración del pago
  const validatePaymentConfig = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Validar método de pago
    if (!state.payment.method) {
      errors.push({
        field: 'paymentMethod',
        message: 'Selecciona un método de pago',
        severity: 'error'
      });
    }

    // Validar tipo de pago
    if (!state.payment.type) {
      errors.push({
        field: 'paymentType',
        message: 'Selecciona un tipo de pago',
        severity: 'error'
      });
    }

    // Validar montos
    if (calculations.total <= 0) {
      errors.push({
        field: 'total',
        message: 'El total debe ser mayor a 0',
        severity: 'error'
      });
    }

    // Validar empresa_id
    if (!state.empresa_id) {
      errors.push({
        field: 'empresa',
        message: 'No se encontró la empresa asociada',
        severity: 'error'
      });
    }

    return errors;
  }, [state.payment, calculations.total, state.empresa_id]);

  // Actualizar errores cuando cambian los valores relevantes
  useEffect(() => {
    const errors = validatePaymentConfig();
    setValidationErrors(errors);
  }, [validatePaymentConfig]);

  // Función para calcular el depósito según el tipo de pago
  const calculateDeposit = useCallback((paymentType: PaymentTypeEnum, total: number) => {
    switch (paymentType) {
      case 'guarantee':
        return 0; // Sin depósito para garantías
      case 'deposit':
        return total * 0.3; // 30% para depósitos
      case 'booking':
        return total; // Pago completo
      default:
        return 0;
    }
  }, []);

  // Función para crear la reserva
  const handleCreateBooking = useCallback(async () => {
    if (isCreating || creationAttempted.current) {
      console.log('Creación en progreso o ya intentada, ignorando llamada');
      return null;
    }

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    if (!state.empresa_id) {
      throw new Error('No se encontró la empresa asociada');
    }

    try {
      setIsCreating(true);
      creationAttempted.current = true;

      console.log('Iniciando creación de reserva con estado:', {
        payment: state.payment,
        calculations,
        validationErrors,
        userId: user.id,
        empresa_id: state.empresa_id,
        rentals,
        selectedItems
      });

      const errors = validatePaymentConfig();
      if (errors.length > 0) {
        const errorMessages = errors.map(e => e.message).join('\n');
        throw new Error(`Validación fallida:\n${errorMessages}`);
      }

      // Obtener la configuración del tipo de pago
      const paymentType = state.payment.type;
      if (!paymentType) {
        throw new Error('Tipo de pago no seleccionado');
      }

      const paymentConfig = PAYMENT_TYPE_MAPPINGS[paymentType];
      if (!paymentConfig) {
        throw new Error('Configuración de tipo de pago no válida');
      }

      // Preparar datos para la creación
      const bookingData = {
        courtId: state.shift.courtId!,
        date: state.shift.date!,
        startTime: state.shift.startTime!,
        endTime: state.shift.endTime!,
        courtPrice: state.shift.price || 0,
        rentalItemsPrice: calculations.itemsTotal,
        paymentMethod: paymentConfig.defaultMethod,
        paymentType: paymentType,
        paymentStatus: paymentConfig.defaultStatus,
        depositAmount: calculateDeposit(paymentType, calculations.total),
        participants: [{ 
          id: user.id,
          userId: user.id,
          role: 'player' as ParticipantRoleEnum
        }],
        rentalItems: rentals.map(rental => ({
          itemId: rental.itemId,
          quantity: rental.quantity,
          pricePerUnit: rental.pricePerUnit,
          totalPrice: rental.totalPrice
        })),
        empresa_id: state.empresa_id
      };

      console.log('Datos de reserva preparados:', {
        ...bookingData,
        rentals: bookingData.rentalItems,
        paymentConfig,
        originalPaymentType: state.payment.type
      });

      // Verificar disponibilidad antes de crear
      const availabilityCheck = await bookingService.checkAvailability(bookingData);
      if (availabilityCheck.error) {
        throw new Error(availabilityCheck.error.message);
      }

      // Crear la reserva
      const result = await bookingService.createBooking(bookingData);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      options.onSuccess?.();
      return result;

    } catch (error) {
      console.error('Error al crear la reserva:', error);
      options.onError?.(error as Error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [state, calculations, validatePaymentConfig, options, isCreating, calculateDeposit, user, rentals, selectedItems]);

  // Función para finalizar configuración
  const finishConfiguration = useCallback(() => {
    console.log('[SummaryBooking] Validando configuración para avanzar', {
      payment: state.payment,
      calculations,
      currentState: state.payment
    });
    
    const errors = validatePaymentConfig();
    setValidationErrors(errors);

    if (errors.length === 0) {
      console.log('[SummaryBooking] Configuración válida, permitiendo navegación');
      setIsConfigurationStep(false);
      options.onSuccess?.();
      return true;
    }

    console.log('[SummaryBooking] Configuración inválida:', errors);
    const errorMessages = errors
      .filter(error => error.severity === 'error')
      .map(error => error.message)
      .join('\n');

    toast.error('Por favor, completa la configuración:\n' + errorMessages);
    return false;
  }, [validatePaymentConfig, options, state.payment, calculations]);

  // Limpiar el estado de creación al desmontar
  useEffect(() => {
    return () => {
      creationAttempted.current = false;
      setIsCreating(false);
    };
  }, []);

  return {
    isValid: validationErrors.length === 0,
    validationErrors,
    hasWarnings: validationErrors.some(error => error.severity === 'warning'),
    calculations,
    isConfigurationStep,
    finishConfiguration,
    currentPayment: state.payment,
    handleCreateBooking,
    isCreating
  };
} 