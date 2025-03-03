import { useSummaryState } from './useSummaryState';
import { useCallback, useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { useForm } from '@/contexts/FormContext';
import { useAuth } from '@/contexts/AuthContext';
import { PAYMENT_TYPE_MAPPINGS, PaymentTypeEnum, ParticipantRoleEnum } from '@/types/bookings';
import { bookingService } from '@/services/bookingService';
import { useFormItems } from '@/contexts/FormItemsContext';
import { PaymentState, BookingPaymentData } from '@/types/payments';

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface UseSummaryBookingOptions {
  onSuccess?: (booking: BookingPaymentData) => void;
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
        mapping: PAYMENT_TYPE_MAPPINGS[selectedPaymentType as PaymentTypeEnum],
        currentType: state.payment.type
      });
      
      // Verificar si el tipo ya está establecido para evitar ciclos
      if (state.payment.type !== selectedPaymentType) {
        console.log('Actualizando tipo de pago en el contexto global:', selectedPaymentType);
        
        // Actualizar el estado global con el tipo seleccionado
        setPayment({
          type: selectedPaymentType as PaymentTypeEnum,
          method: state.payment.method,  // Mantener el método existente
          selectedPaymentMethod: state.payment.selectedPaymentMethod  // Mantener el método seleccionado
        });

        console.log('Estado actualizado después de sincronización:', {
          payment: state.payment,
          mapping: PAYMENT_TYPE_MAPPINGS[selectedPaymentType as PaymentTypeEnum]
        });
      } else {
        console.log('El tipo de pago ya está sincronizado con el contexto global');
      }
    }
  }, [selectedPaymentType, setPayment, state.payment]);

  // También sincronizar cuando cambia el método seleccionado
  useEffect(() => {
    if (selectedPaymentMethod && selectedPaymentType && !state.payment.type) {
      console.log('Detectado método seleccionado sin tipo en contexto global. Sincronizando tipo:', selectedPaymentType);
      
      setPayment({
        type: selectedPaymentType as PaymentTypeEnum,
        method: state.payment.method,
        selectedPaymentMethod: state.payment.selectedPaymentMethod
      });
    }
  }, [selectedPaymentMethod, selectedPaymentType, state.payment, setPayment]);

  // Validar la configuración del pago
  const validatePaymentConfig = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];

    console.log('[useSummaryBooking] Validando configuración de pago:', {
      payment: state.payment,
      selectedMethod: state.payment.selectedPaymentMethod,
      type: state.payment.type,
      hasMethod: !!state.payment.method,
      hasSelectedMethod: !!state.payment.selectedPaymentMethod,
      hasType: !!state.payment.type
    });

    // Verificación detallada del método de pago
    const hasValidMethod = !!state.payment.method || 
                          (state.payment.selectedPaymentMethod && 
                           !!state.payment.selectedPaymentMethod.id);
    
    if (!hasValidMethod) {
      console.error('[useSummaryBooking] Método de pago inválido o faltante:', {
        method: state.payment.method,
        selectedMethod: state.payment.selectedPaymentMethod
      });
      
      errors.push({
        field: 'paymentMethod',
        message: 'Selecciona un método de pago',
        severity: 'error'
      });
    } else {
      console.log('[useSummaryBooking] Método de pago válido encontrado');
    }

    // Verificación detallada del tipo de pago
    if (!state.payment.type) {
      console.error('[useSummaryBooking] Tipo de pago faltante');
      
      errors.push({
        field: 'paymentType',
        message: 'Selecciona un tipo de pago',
        severity: 'error'
      });
    } else {
      console.log('[useSummaryBooking] Tipo de pago válido:', state.payment.type);
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

      // Mapear 'full' a 'booking' si es necesario
      const normalizedPaymentType = paymentType === 'full' as any ? 'booking' : paymentType as PaymentTypeEnum;
      
      // Buscar configuración basada en el tipo normalizado
      const paymentConfig = PAYMENT_TYPE_MAPPINGS[normalizedPaymentType as PaymentTypeEnum];
      if (!paymentConfig) {
        console.error('Configuración de tipo de pago no válida:', {
          originalType: paymentType,
          normalizedType: normalizedPaymentType,
          availableMappings: Object.keys(PAYMENT_TYPE_MAPPINGS)
        });
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
        paymentType: normalizedPaymentType,
        paymentStatus: paymentConfig.defaultStatus,
        depositAmount: calculateDeposit(normalizedPaymentType, calculations.total),
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
        empresa_id: state.empresa_id,
        stripe_payment_method_id: normalizedPaymentType === 'guarantee' ? state.payment.selectedPaymentMethod?.id : undefined
      };

      console.log('Datos de reserva preparados:', {
        ...bookingData,
        rentals: bookingData.rentalItems,
        paymentConfig,
        originalPaymentType: state.payment.type
      });

      // Validar configuración especial para pago completo
      if (state.payment.type === 'full') {
        if (!state.payment.stripe_payment_intent_id) {
          console.error('[useSummaryBooking] Pago completo sin PaymentIntent:', state.payment);
          throw new Error('No se encontró confirmación del pago con Stripe');
        }

        // Forzar configuración correcta para pago con Stripe
        bookingData.paymentMethod = 'stripe';
        bookingData.paymentStatus = 'completed';
        bookingData.stripe_payment_intent_id = state.payment.stripe_payment_intent_id;
        
        console.log('[useSummaryBooking] Datos de pago Stripe configurados:', {
          method: bookingData.paymentMethod,
          status: bookingData.paymentStatus,
          paymentIntentId: bookingData.stripe_payment_intent_id
        });
      }

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