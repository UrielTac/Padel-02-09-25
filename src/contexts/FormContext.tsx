'use client';

import { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { PublishedForm } from '@/types/forms/publish';
import { PaymentMethodEnum, PaymentStatusEnum, PaymentTypeEnum, PAYMENT_TYPE_MAPPINGS } from '@/types/bookings';

interface LocationState {
  branchId: string | null;
  branchName?: string;
}

interface ShiftState {
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  duration: number;
  courtId: string | null;
  courtName?: string;
  price?: number;
}

interface ItemsState {
  selectedItems: Record<string, number>; // itemId -> quantity
}

interface PaymentState {
  method: PaymentMethodEnum | null;
  type: PaymentTypeEnum | null;
}

interface FormState {
  location: LocationState;
  shift: ShiftState;
  items: ItemsState;
  payment: PaymentState;
  currentStep: number;
  empresa_id: string | null;
}

type FormAction =
  | { type: 'SET_LOCATION'; payload: LocationState }
  | { type: 'SET_SHIFT'; payload: ShiftState }
  | { type: 'SET_ITEMS'; payload: ItemsState }
  | { type: 'SET_PAYMENT'; payload: PaymentState }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_EMPRESA_ID'; payload: string }
  | { type: 'CLEAR_AFTER_STEP'; payload: number }
  | { type: 'RESET_FORM' };

interface FormProviderProps {
  children: ReactNode;
  initialForm: PublishedForm | null;
}

const initialState: FormState = {
  location: {
    branchId: null,
  },
  shift: {
    date: null,
    startTime: null,
    endTime: null,
    duration: 1,
    courtId: null,
    price: 0,
  },
  items: {
    selectedItems: {},
  },
  payment: {
    method: null,
    type: null
  },
  currentStep: 0,
  empresa_id: null,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_LOCATION':
      return {
        ...state,
        location: action.payload,
        // Limpiar estados posteriores
        shift: initialState.shift,
        items: initialState.items,
      };
    
    case 'SET_SHIFT':
      return {
        ...state,
        shift: action.payload,
        // Limpiar estados posteriores
        items: initialState.items,
      };
    
    case 'SET_ITEMS':
      return {
        ...state,
        items: action.payload,
      };
    
    case 'SET_PAYMENT':
      console.log('FormContext: Actualizando estado de pago:', action.payload);
      
      const paymentType = action.payload.type as PaymentTypeEnum;
      const paymentMapping = paymentType ? PAYMENT_TYPE_MAPPINGS[paymentType] : null;
      
      const newPaymentState = {
        method: paymentMapping?.defaultMethod || action.payload.method,
        type: action.payload.type
      };

      console.log('FormContext: Nuevo estado de pago:', newPaymentState);

      return {
        ...state,
        payment: newPaymentState
      };
    
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };
    
    case 'SET_EMPRESA_ID':
      return {
        ...state,
        empresa_id: action.payload
      };
    
    case 'CLEAR_AFTER_STEP':
      if (action.payload === 0) {
        return {
          ...state,
          shift: initialState.shift,
          items: initialState.items,
        };
      } else if (action.payload === 1) {
        return {
          ...state,
          items: initialState.items,
        };
      }
      return state;
    
    case 'RESET_FORM':
      // Mantener empresa_id al resetear el formulario
      return {
        ...initialState,
        empresa_id: state.empresa_id,
        currentStep: 0
      };
    
    default:
      return state;
  }
}

interface FormContextType {
  state: FormState;
  setLocation: (location: LocationState) => void;
  setShift: (shift: ShiftState) => void;
  setItems: (items: ItemsState) => void;
  setPayment: (payment: PaymentState) => void;
  setStep: (step: number) => void;
  clearAfterStep: (step: number) => void;
  resetForm: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children, initialForm }: FormProviderProps) {
  const [state, dispatch] = useReducer(formReducer, {
    ...initialState,
    empresa_id: initialForm?.empresa_id || null
  });

  // Efecto único para inicializar el estado con el formulario inicial
  useEffect(() => {
    if (initialForm?.empresa_id) {
      dispatch({ 
        type: 'SET_EMPRESA_ID', 
        payload: initialForm.empresa_id 
      });
    }
  }, [initialForm?.empresa_id]); // Solo se ejecuta cuando cambia el empresa_id

  // Efecto para limpiar el formulario al cerrar la ventana
  useEffect(() => {
    const handleBeforeUnload = () => {
      dispatch({ type: 'RESET_FORM' });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Solo se ejecuta una vez al montar

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  const setLocation = useCallback((location: LocationState) => {
    dispatch({ type: 'SET_LOCATION', payload: location });
  }, []);

  const setShift = useCallback((shift: ShiftState) => {
    dispatch({ type: 'SET_SHIFT', payload: shift });
  }, []);

  const setItems = useCallback((items: ItemsState) => {
    dispatch({ type: 'SET_ITEMS', payload: items });
  }, []);

  const setPayment = useCallback((payment: PaymentState) => {
    dispatch({ type: 'SET_PAYMENT', payload: payment });
  }, []);

  const setStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const clearAfterStep = useCallback((step: number) => {
    dispatch({ type: 'CLEAR_AFTER_STEP', payload: step });
  }, []);

  return (
    <FormContext.Provider
      value={{
        state,
        setLocation,
        setShift,
        setItems,
        setPayment,
        setStep,
        clearAfterStep,
        resetForm,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export function useForm() {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
} 