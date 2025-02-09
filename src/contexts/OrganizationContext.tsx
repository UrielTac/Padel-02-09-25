"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type Organization = Database['public']['Tables']['empresas']['Row']

interface OrganizationContextType {
  organization: Organization | null
  isLoading: boolean
  error: Error | null
}

interface UserMetadata {
  empresa_id?: string;
  [key: string]: any;
}

const EMPRESA_ID_STORAGE_KEY = 'current_empresa_id';

// Funciones de caché mejoradas
export function setEmpresaId(id: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(EMPRESA_ID_STORAGE_KEY, id);
    console.log('💾 Empresa ID guardado en caché:', id);
  }
}

function getEmpresaIdFromCache(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(EMPRESA_ID_STORAGE_KEY);
  }
  return null;
}

// Exportamos el contexto para que esté disponible si es necesario
export const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createSupabaseClient()

  useEffect(() => {
    let isMounted = true;

    const loadOrganization = async () => {
      try {
        // Si aún está cargando la autenticación, esperar
        if (authLoading) {
          console.log('🔄 Esperando autenticación...');
          return;
        }

        // Si no hay usuario, no cargar organización
        if (!user) {
          console.log('❌ No hay usuario autenticado');
          if (isMounted) {
            setIsLoading(false);
            setError(new Error('No hay usuario autenticado'));
          }
          return;
        }

        // Intentar obtener empresa_id del caché
        const empresaId = getEmpresaIdFromCache();
        console.log('🔍 Buscando empresa_id en caché:', empresaId);
        
        if (!empresaId) {
          console.error('❌ No se encontró empresa_id en caché');
          if (isMounted) {
            setError(new Error('No se encontró la empresa'));
            setIsLoading(false);
          }
          return;
        }

        console.log('🔍 Buscando empresa desde caché:', empresaId);

        const { data, error: dbError } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', empresaId)
          .single()

        if (dbError) {
          console.error('❌ Error al cargar empresa:', dbError);
          throw dbError;
        }

        if (!data) {
          console.error('❌ No se encontró la empresa');
          throw new Error('No se encontró la empresa');
        }

        if (isMounted) {
          console.log('✅ Empresa cargada desde caché:', data);
          setOrganization(data);
          setError(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Error al cargar organización:', error);
        if (isMounted) {
          setError(error as Error);
          setOrganization(null);
          setIsLoading(false);
        }
      }
    }

    void loadOrganization();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, supabase]);

  return (
    <OrganizationContext.Provider value={{ organization, isLoading, error }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization debe ser usado dentro de un OrganizationProvider')
  }
  return context
} 