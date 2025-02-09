'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from '@/contexts/FormContext';
import { FormPublishService } from '@/lib/services/forms/publish-service';
import { validateStepOrder } from '@/lib/mappers/preview-to-public';
import { PublishedForm } from '@/types/forms/publish';
import { PublicFormLayout } from './layout/PublicFormLayout';

interface PublicFormContentProps {
  form: PublishedForm;
}

export function PublicFormContent({ form }: PublicFormContentProps) {
  const { state, setStep, resetForm } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Efecto para reiniciar el formulario cuando cambia
  useEffect(() => {
    console.log('[PublicFormContent] Inicializando formulario:', {
      id: form.id,
      empresa_id: form.empresa_id
    });
    resetForm();
  }, [form, resetForm]);

  // Incrementar vistas al cargar
  useEffect(() => {
    const formService = new FormPublishService();
    formService.incrementViews(form.slug).catch(console.error);
  }, [form.slug]);

  const handleNext = useCallback(() => {
    if (!form?.fields) {
      console.warn('[Navigation] No hay campos definidos en el formulario');
      return;
    }

    const currentField = form.fields[state.currentStep];
    const nextStepIndex = state.currentStep + 1;
    const nextField = form.fields[nextStepIndex];

    console.log('[Navigation] Iniciando navegación al siguiente paso:', {
      currentStep: currentField?.type,
      nextStep: nextField?.type,
      isLastStep: !nextField,
      canProceed: true // Siempre permitimos avanzar en el formulario público
    });

    if (!currentField) {
      console.warn('[Navigation] Campo actual no encontrado');
      return;
    }

    const isValid = validateStepOrder(
      currentField.type,
      nextField ? nextField.type : 'end'
    );

    console.log('[Navigation] Validación de orden:', { isValid });

    if (!isValid) {
      console.warn('[Navigation] Orden de pasos inválido');
      return;
    }

    console.log('[Navigation] Avanzando al siguiente paso:', nextField?.type || 'end');
    setStep(nextStepIndex);
  }, [form?.fields, state.currentStep, setStep]);

  const handlePrev = () => {
    if (state.currentStep <= 0) {
      console.log('[PublicFormContent] Ya estamos en el primer paso');
      return;
    }

    console.log('[PublicFormContent] Retrocediendo desde paso:', {
      from: state.currentStep,
      to: state.currentStep - 1,
      type: form?.fields[state.currentStep - 1]?.type
    });
    
    setStep(state.currentStep - 1);
  };

  const handleExitClick = () => {
    // Verificar si hay datos pendientes
    const hasUnsavedChanges = Object.values(state).some(value => value !== null);
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
    } else {
      window.location.href = '/';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Cargando formulario...
          </h2>
          <p className="text-gray-500">
            Por favor, espera un momento
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error al cargar el formulario
          </h2>
          <p className="text-gray-500">
            {error?.message || 'No se pudo cargar el formulario'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PublicFormLayout
      form={form}
      fields={form.fields}
      currentStep={state.currentStep}
      onNext={handleNext}
      onPrev={handlePrev}
      isPublicView
      slug={form.slug}
    />
  );
}