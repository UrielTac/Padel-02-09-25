import { useState, useEffect } from 'react';
import { PublishedForm } from '@/types/forms/publish';
import { PublicFormContent } from './PublicFormContent';
import { cn } from '@/lib/utils';
import { sortFormFields } from '@/lib/mappers/preview-to-public';
import { FormStepField } from '@/types/form-steps';

interface PublicFormLayoutProps {
  form: PublishedForm;
  fields: FormStepField[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  isPublicView?: boolean;
  slug: string;
}

export function PublicFormLayout({
  form,
  fields,
  currentStep,
  onNext,
  onPrev,
  isPublicView = false,
  slug
}: PublicFormLayoutProps) {
  const [viewType, setViewType] = useState<"mobile" | "desktop">("desktop");
  // Ordenar los campos al inicializar
  const [formFields, setFormFields] = useState(() => sortFormFields(form.fields));

  const currentField = fields[currentStep];

  console.log('[PublicFormLayout] Renderizando con:', {
    currentStep,
    fieldType: currentField?.type,
    slug,
    empresa_id: form.empresa_id
  });

  // Detectar el tipo de vista basado en el ancho de la pantalla
  useEffect(() => {
    const handleResize = () => {
      setViewType(window.innerWidth < 768 ? "mobile" : "desktop");
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Efecto para mantener los campos ordenados cuando cambian
  useEffect(() => {
    setFormFields(sortFormFields(form.fields));
  }, [form.fields]);

  const handleStepChange = (stepId: string, newSettings: any) => {
    console.log('PublicFormLayout - Actualizando paso:', stepId, 'con:', newSettings);
    
    // Actualizar el estado local manteniendo el orden
    setFormFields(prevFields => 
      sortFormFields(
        prevFields.map(field => 
          field.id === stepId 
            ? { ...field, settings: { ...field.settings, ...newSettings } }
            : field
        )
      )
    );

    // Propagar el cambio hacia arriba
    onStepChange(stepId, newSettings);
  };

  return (
    <div className={cn(
      "w-full",
      viewType === "mobile" && "w-full max-w-[430px] mx-auto"
    )}>
      <PublicFormContent
        fields={formFields}
        currentStep={currentStep}
        onStepChange={handleStepChange}
        onNext={onNext}
        onPrev={onPrev}
        onSubmit={async () => {}}
        isSubmitting={false}
        error={null}
        theme={form.settings.theme || 'light'}
        viewType={viewType}
        slug={slug}
      />
    </div>
  );
} 