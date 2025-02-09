import { FormStepField } from '@/types/form-steps';
import { LocationStepField, LocationStepSettings } from '@/components/steps/location/types';
import { ShiftsStepField, ShiftsStepSettings } from '@/components/steps/shifts/types';
import { ItemsStepField, ItemsStepSettings } from '@/components/steps/items/types';
import { SummaryStepField, SummaryStepSettings } from '@/components/steps/summary/types';
import { GreetingStepField } from '@/components/steps/greeting/types';
import { FarewellStepField, FarewellStepSettings } from '@/components/steps/farewell/types';
import * as PreviewComponents from '@/components/preview/steps';

// Definición de la secuencia de pasos
const STEP_SEQUENCE = {
  GREETING: 'greeting',
  LOCATION: 'location',
  SHIFTS: 'shifts',
  ITEMS: 'items',
  SUMMARY: 'summary',
  FAREWELL: 'farewell'
} as const;

type StepType = typeof STEP_SEQUENCE[keyof typeof STEP_SEQUENCE];

// Orden estricto de los pasos
const STEP_ORDER = [
  STEP_SEQUENCE.GREETING,
  STEP_SEQUENCE.LOCATION,
  STEP_SEQUENCE.SHIFTS,
  STEP_SEQUENCE.ITEMS,
  STEP_SEQUENCE.SUMMARY,
  STEP_SEQUENCE.FAREWELL
];

// Mapeo bidireccional de tipos con transformaciones
const TYPE_MAPPINGS = {
  // Mapeo de tipo original a tipo del sistema
  toSystem: {
    'date': {
      type: STEP_SEQUENCE.LOCATION,
      transform: (field: FormStepField): LocationStepField => {
        const defaultSettings: LocationStepSettings = {
          isActive: true,
          showMap: true,
          showAddress: true,
          showDirections: true,
          defaultLocation: { lat: 0, lng: 0 },
          showBranches: true,
          showSchedule: true,
          showContactInfo: true,
          allowMultipleBranches: false
        };

        return {
          id: field.id,
          type: 'location',
          label: field.label,
          title: 'Seleccionar Ubicación',
          description: 'Elige la sede más conveniente para ti',
          required: true,
          settings: defaultSettings
        };
      }
    },
    'court': {
      type: STEP_SEQUENCE.SHIFTS,
      transform: (field: FormStepField): ShiftsStepField => {
        const defaultSettings: ShiftsStepSettings = {
          isActive: true,
          showFullCalendar: true,
          showTimeSlots: true,
          showDuration: true,
          showCapacity: true,
          showPrice: true,
          allowMultipleSlots: false,
          minDuration: {
            value: 60,
            unit: 'minutes'
          },
          maxDuration: {
            value: 180,
            unit: 'minutes'
          },
          allowDurationChange: true,
          showAvailability: true
        };

        return {
          id: field.id,
          type: 'shifts',
          label: field.label,
          title: 'Seleccionar Turno',
          description: 'Elige el horario que mejor se adapte a tu agenda',
          required: true,
          settings: defaultSettings
        };
      }
    },
    'players': {
      type: STEP_SEQUENCE.ITEMS,
      transform: (field: FormStepField): ItemsStepField => {
        const defaultSettings: ItemsStepSettings = {
          isActive: true,
          showImages: true,
          showPrices: true,
          showQuantity: true,
          showDiscount: true,
          showCategories: true,
          allowMultiple: true,
          showStock: true,
          categories: [],
          maxItemsPerOrder: 10,
          showDescription: true
        };

        return {
          id: field.id,
          type: 'items',
          label: field.label,
          title: 'Seleccionar Jugadores',
          description: 'Indica cuántos jugadores participarán',
          required: true,
          settings: defaultSettings
        };
      }
    },
    'summary': {
      type: STEP_SEQUENCE.SUMMARY,
      transform: (field: FormStepField): SummaryStepField => {
        const defaultSettings: SummaryStepSettings = {
          isActive: true,
          showCoupons: true,
          paymentTypes: {
            payment: true
          },
          sections: {
            payment: true
          }
        };

        return {
          id: field.id,
          type: 'summary',
          label: field.label,
          title: 'Resumen de Reserva',
          description: 'Revisa los detalles de tu reserva',
          required: true,
          settings: defaultSettings
        };
      }
    },
    'greeting': {
      type: STEP_SEQUENCE.GREETING,
      transform: (field: FormStepField): GreetingStepField => ({
        id: field.id,
        type: 'greeting',
        label: field.label,
        settings: {
          title: '¡Bienvenido!',
          subtitle: 'Comencemos con tu reserva'
        }
      })
    },
    'farewell': {
      type: STEP_SEQUENCE.FAREWELL,
      transform: (field: FormStepField): FarewellStepField => {
        const defaultSettings: FarewellStepSettings = {
          isActive: true,
          showDirections: true,
          showBookingSummary: true,
          showContactInfo: true,
          showSocialShare: true,
          showAddToCalendar: true,
          showDownloadPDF: true,
          showSendEmail: true,
          showQRCode: true,
          showConfirmationNumber: true,
          messageStyle: 'success',
          customMessage: '',
          actions: {
            downloadPDF: true,
            sendEmail: true,
            addToCalendar: true,
            share: true
          }
        };

        return {
          id: field.id,
          type: 'farewell',
          label: field.label,
          title: '¡Gracias!',
          description: 'Tu reserva ha sido confirmada',
          required: true,
          settings: defaultSettings
        };
      }
    }
  }
};

// Componentes por tipo del sistema
const componentMap: Record<StepType, any> = {
  [STEP_SEQUENCE.GREETING]: PreviewComponents.GreetingPreview,
  [STEP_SEQUENCE.LOCATION]: PreviewComponents.LocationPreview,
  [STEP_SEQUENCE.SHIFTS]: PreviewComponents.ShiftsPreview,
  [STEP_SEQUENCE.ITEMS]: PreviewComponents.ItemsPreview,
  [STEP_SEQUENCE.SUMMARY]: PreviewComponents.SummaryPreview,
  [STEP_SEQUENCE.FAREWELL]: PreviewComponents.FarewellPreview,
};

// Función para mapear y transformar el campo
function mapField(field: FormStepField): FormStepField {
  const mapping = TYPE_MAPPINGS.toSystem[field.type as keyof typeof TYPE_MAPPINGS.toSystem];
  
  if (!mapping) {
    console.warn(`[TypeMapper] No se encontró mapeo para: ${field.type}`);
    return field;
  }

  console.log(`[TypeMapper] Mapeando tipo: ${field.type} -> ${mapping.type}`);
  return mapping.transform(field);
}

// Función para obtener el orden de un tipo
function getStepOrder(type: string): number {
  const mapping = TYPE_MAPPINGS.toSystem[type as keyof typeof TYPE_MAPPINGS.toSystem];
  const systemType = mapping ? mapping.type : type as StepType;
  const order = STEP_ORDER.indexOf(systemType);
  
  console.log(`[OrderMapper] Orden para ${type} -> ${systemType}: ${order}`);
  return order === -1 ? 999 : order;
}

// Función para ordenar los campos según el orden definido
export function sortFormFields(fields: FormStepField[]): FormStepField[] {
  console.log('[FieldSorter] Campos originales:', fields.map(f => f.type));

  // Asegurar que tenemos el paso de bienvenida
  const hasGreeting = fields.some(f => f.type === STEP_SEQUENCE.GREETING);
  const completeFields = hasGreeting ? fields : [
    {
      id: 'greeting-step',
      type: STEP_SEQUENCE.GREETING,
      label: 'Bienvenida',
      title: '¡Bienvenido!',
      description: 'Comencemos con tu reserva',
      required: true,
      settings: {
        title: '¡Bienvenido a nuestra plataforma de reservas!',
        subtitle: 'Estamos encantados de ayudarte con tu reserva',
        description: 'Sigue los pasos para completar tu reserva de manera fácil y rápida.',
        showAnimation: true,
        theme: 'light'
      }
    } as FormStepField,
    ...fields
  ];

  // Mapear y transformar campos
  const mappedFields = completeFields.map(field => {
    const mappedField = mapField(field);
    const order = getStepOrder(field.type);
    
    console.log(`[FieldSorter] Mapeando campo: ${field.type} -> ${mappedField.type} (orden: ${order})`);
    
    return mappedField;
  });

  // Ordenar por el orden explícito
  const sortedFields = [...mappedFields].sort((a, b) => {
    const orderA = getStepOrder(a.type);
    const orderB = getStepOrder(b.type);
    
    console.log(`[FieldSorter] Comparando: ${a.type}(${orderA}) vs ${b.type}(${orderB})`);
    
    return orderA - orderB;
  });

  console.log('[FieldSorter] Campos ordenados:', sortedFields.map(f => ({ 
    type: f.type, 
    order: getStepOrder(f.type),
    settings: f.settings 
  })));
  
  return sortedFields;
}

// Validación de orden de pasos
export function validateStepOrder(currentType: string, nextType: string): boolean {
  console.log('[StepOrder] Validando orden:', {
    currentType,
    nextType,
    STEP_ORDER,
    totalSteps: STEP_ORDER.length,
    currentIndex: STEP_ORDER.indexOf(currentType),
    nextIndex: STEP_ORDER.indexOf(nextType)
  });

  // Si nextType es 'end', significa que estamos en el último paso
  if (nextType === 'end') {
    console.log('[StepOrder] Último paso alcanzado');
    return true;
  }

  const currentOrder = getStepOrder(currentType);
  const nextOrder = getStepOrder(nextType);

  // Si alguno de los tipos no está en la secuencia, permitir el avance
  if (currentOrder === -1 || nextOrder === -1) {
    console.log('[StepOrder] Tipo no encontrado en secuencia, permitiendo avance');
    return true;
  }

  const isConsecutive = nextOrder - currentOrder === 1;
  const isValid = nextOrder > currentOrder;
  const isLastStep = nextOrder === STEP_ORDER.length - 1;

  console.log('[StepOrder] Análisis de orden:', {
    currentOrder,
    nextOrder,
    isConsecutive,
    isValid,
    isLastStep,
    currentType,
    nextType
  });

  // Para el paso de items a summary, siempre permitir
  if (currentType === STEP_SEQUENCE.ITEMS && nextType === STEP_SEQUENCE.SUMMARY) {
    console.log('[StepOrder] Permitiendo avance de items a summary');
    return true;
  }

  // Para el último paso, permitir si es válido
  if (isLastStep) {
    console.log('[StepOrder] Avanzando al último paso');
    return isValid;
  }

  return isValid && isConsecutive;
}

// Función para obtener el componente público
export function getPublicComponent(field: FormStepField) {
  console.log('[ComponentMapper] Obteniendo componente para:', {
    fieldType: field.type,
    availableComponents: Object.keys(componentMap)
  });

  const mapping = TYPE_MAPPINGS.toSystem[field.type as keyof typeof TYPE_MAPPINGS.toSystem];
  const systemType = mapping ? mapping.type : field.type as StepType;
  const component = componentMap[systemType];
  
  if (!component) {
    console.warn(`[ComponentMapper] No se encontró componente para: ${field.type} -> ${systemType}`);
  } else {
    console.log(`[ComponentMapper] Componente encontrado:`, {
      originalType: field.type,
      mappedType: systemType,
      hasComponent: !!component
    });
  }

  return component;
}