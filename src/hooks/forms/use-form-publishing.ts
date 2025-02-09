'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useOrganization } from '@/contexts/OrganizationContext';
import { formPublishService } from '@/lib/services/forms/publish-service';
import { toast } from 'sonner';

interface FormPublishConfig {
  title: string;
  description?: string;
  fields: any[];
  theme?: 'light' | 'dark';
  customization?: {
    colors?: {
      primary?: string;
    };
    logo?: {
      url?: string;
    };
  };
}

export function useFormPublishing() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const { organization, isLoading: orgLoading } = useOrganization();

  // Manejar estados de carga de manera más granular
  const isLoading = authLoading || orgLoading;

  const handleError = (err: unknown): Error => {
    const error = err instanceof Error ? err : new Error('Error desconocido al publicar el formulario');
    setError(error);
    toast.error(error.message);
    return error;
  };

  const publishForm = async (config: FormPublishConfig): Promise<string> => {
    if (isLoading) {
      throw new Error('Cargando datos de autenticación...');
    }

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    if (!organization) {
      throw new Error('No hay organización seleccionada');
    }

    setIsPublishing(true);
    setError(null);

    try {
      console.log('📝 Iniciando publicación del formulario:', {
        ...config,
        organizationId: organization.id
      });

      // Publicar el formulario incluyendo el empresa_id
      const url = await formPublishService.publish({
        ...config,
        empresa_id: organization.id
      });

      console.log('✅ Formulario publicado:', { url });
      toast.success('Formulario publicado exitosamente');

      return url;
    } catch (error) {
      console.error('❌ Error al publicar:', error);
      throw handleError(error);
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    isPublishing: isPublishing || isLoading,
    error,
    publishForm,
    isLoading
  };
} 