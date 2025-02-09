import { getPublicComponent, validateStepOrder } from '@/lib/mappers/preview-to-public';
import { FormStepField } from '@/types/form-steps';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { FormError } from '../shared/FormStatusMessages';
import { FormContainer } from './FormContainer';
import { useForm } from '@/contexts/FormContext';
import { toast } from 'react-hot-toast';

interface PublicFormContentProps {
  fields: FormStepField[];
  currentStep: number;
  onStepChange: (stepId: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  error: Error | null;
  theme: 'light' | 'dark';
  viewType: "mobile" | "desktop";
  slug: string;
}

export function PublicFormContent({
  fields,
  currentStep,
  onStepChange,
  onNext,
  onPrev,
  onSubmit,
  isSubmitting,
  error,
  theme,
  viewType,
  slug
}: PublicFormContentProps) {
  const currentField = fields[currentStep];
  const nextField = fields[currentStep + 1];
  const isLastStep = currentStep === fields.length - 1;
  const { state } = useForm();

  const handleFieldUpdate = (field: FormStepField, newSettings: Record<string, any>) => {
    console.log('PublicFormContent - Actualizando campo:', field.id, 'con settings:', newSettings);
    onStepChange(field.id, newSettings);
  };

  const handleNext = () => {
    if (!currentField) {
      console.log('No hay campo actual');
      return;
    }

    if (isLastStep) {
      console.log('Último paso, enviando formulario');
      onSubmit();
      return;
    }

    if (!nextField) {
      console.log('No hay siguiente paso');
      return;
    }

    const isValidOrder = validateStepOrder(currentField.type, nextField.type);
    console.log('Validación de orden:', { 
      currentType: currentField.type, 
      nextType: nextField.type, 
      isValid: isValidOrder 
    });

    if (isValidOrder) {
      console.log('Orden válido, avanzando al siguiente paso');
      onNext();
    } else {
      console.log('No se puede avanzar: orden de pasos inválido');
      toast.error('Error en el orden de los pasos');
    }
  };

  // Determinar si es un paso especial que maneja su propia navegación
  const isSpecialStep = (type: string) => {
    return [
      'greeting',
      'login',
      'farewell',
      'sign-in',
      'sign-up',
      'auth',
      'users'
    ].includes(type);
  };

  // Verificar si el botón siguiente debe estar deshabilitado
  const isNextDisabled = () => {
    if (!currentField) return true;

    switch (currentField.type) {
      case 'location':
        return !state.location.branchId;
      case 'shifts':
        return !state.shift.startTime;
      case 'items':
        return false; // Los items son opcionales
      default:
        return false;
    }
  };

  // Obtener el texto del botón según el tipo de paso
  const getNextButtonLabel = () => {
    if (isLastStep) return 'Reservar';
    return 'Siguiente';
  };

  const renderField = (field: FormStepField) => {
    const PreviewComponent = getPublicComponent(field);
    
    if (!PreviewComponent) {
      console.warn(`No preview component found for field type: ${field.type}`);
      return null;
    }

    return (
      <PreviewComponent
        field={field}
        theme={theme}
        viewType={viewType}
        onNext={handleNext}
        onPrev={onPrev}
        isFirstStep={currentStep === 0}
        isLastStep={isLastStep}
        onStepChange={(newSettings: Record<string, any>) => handleFieldUpdate(field, newSettings)}
        isPublicView={true}
        slug={slug}
      />
    );
  };

  return (
    <FormContainer
      theme={theme}
      viewType={viewType}
      onNext={handleNext}
      onPrev={onPrev}
      isFirstStep={currentStep === 0}
      isLastStep={isLastStep}
      hideNavigation={currentField && isSpecialStep(currentField.type)}
      isNextDisabled={isNextDisabled()}
      nextLabel={getNextButtonLabel()}
      currentStep={currentStep}
    >
      <div className="max-w-lg mx-auto space-y-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentField.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {renderField(currentField)}
            {error && <FormError message={error.message} theme={theme} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </FormContainer>
  );
} 
