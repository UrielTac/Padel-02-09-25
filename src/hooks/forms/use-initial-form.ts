'use client';

import { useEffect, useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { PublishedForm } from '@/types/forms/publish';

interface UseInitialFormResult {
  initialForm: PublishedForm | null;
  isLoading: boolean;
  error: Error | null;
}

export function useInitialForm(): UseInitialFormResult {
  const [initialForm, setInitialForm] = useState<PublishedForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organization, isLoading: orgLoading, error: orgError } = useOrganization();

  useEffect(() => {
    const initializeForm = async () => {
      try {
        console.log('🔄 useInitialForm - Estado:', {
          orgLoading,
          hasOrganization: !!organization,
          organizationId: organization?.id,
          orgError
        });

        // Si aún está cargando la organización, mantener el estado de carga
        if (orgLoading) {
          setIsLoading(true);
          return;
        }

        // Si hay un error en la organización, propagarlo
        if (orgError) {
          console.error('❌ Error de organización:', orgError);
          setError(orgError);
          setIsLoading(false);
          return;
        }

        // Si no hay organización después de la carga, mostrar error
        if (!organization) {
          console.error('❌ No se encontró la organización');
          setError(new Error('No se encontró la organización'));
          setIsLoading(false);
          return;
        }

        // Crear el formulario inicial
        console.log('✅ Configurando formulario inicial con empresa:', organization.id);
        const newForm: PublishedForm = {
          id: crypto.randomUUID(),
          empresa_id: organization.id,
          slug: '',
          status: 'published',
          isCustomizable: true
        };

        setInitialForm(newForm);
        setError(null);
        setIsLoading(false);

        console.log('✅ Formulario inicial configurado:', newForm);
      } catch (err) {
        console.error('❌ Error al inicializar formulario:', err);
        setError(err instanceof Error ? err : new Error('Error desconocido'));
        setIsLoading(false);
      }
    };

    void initializeForm();
  }, [organization, orgLoading, orgError]);

  return { initialForm, isLoading, error };
}