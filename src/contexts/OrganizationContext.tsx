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
  setOrganization: (org: Organization) => void
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

const ORGANIZATION_CHECK_INTERVAL = 1000 * 60 * 5 // 5 minutos
const ORGANIZATION_CHECK_KEY = 'last_organization_check'

function shouldCheckOrganization(): boolean {
  const lastCheck = localStorage.getItem(ORGANIZATION_CHECK_KEY)
  if (!lastCheck) return true
  
  const timeSinceLastCheck = Date.now() - parseInt(lastCheck)
  return timeSinceLastCheck > ORGANIZATION_CHECK_INTERVAL
}

function updateLastOrganizationCheck() {
  localStorage.setItem(ORGANIZATION_CHECK_KEY, Date.now().toString())
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
        if (authLoading) return;

        // Si no hay usuario, no cargar organización
        if (!user) {
          if (isMounted) {
            setIsLoading(false);
            setError(new Error('No hay usuario autenticado'));
          }
          return;
        }

        // Verificar si necesitamos recargar la organización
        if (!shouldCheckOrganization()) {
          const cachedOrg = organization
          if (cachedOrg) {
            console.log('⏭️ Usando organización en caché')
            return
          }
        }

        // Intentar obtener empresa_id del caché
        const empresaId = getEmpresaIdFromCache();
        
        if (!empresaId) {
          if (isMounted) {
            setError(new Error('No se encontró la empresa'));
            setIsLoading(false);
          }
          return;
        }

        const { data, error: dbError } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', empresaId)
          .single()

        if (dbError) throw dbError;

        if (!data) {
          throw new Error('No se encontró la empresa');
        }

        if (isMounted) {
          setOrganization(data);
          setError(null);
          setIsLoading(false);
          updateLastOrganizationCheck();
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
  }, [user, authLoading, supabase, organization]);

  const value = {
    organization,
    isLoading,
    error,
    setOrganization
  };

  return (
    <OrganizationContext.Provider value={value}>
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