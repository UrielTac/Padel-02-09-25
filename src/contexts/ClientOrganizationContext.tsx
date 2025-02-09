"use client"

import { createContext, useContext, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type Organization = Database['public']['Tables']['empresas']['Row']

interface ClientOrganizationContextType {
  organization: Organization | null
  isLoading: boolean
  error: Error | null
}

const ClientOrganizationContext = createContext<ClientOrganizationContextType | undefined>(undefined)

export function ClientOrganizationProvider({ children, empresaId }: { children: React.ReactNode, empresaId?: string }) {
  const supabase = createSupabaseClient()

  // Primero, buscar el empresa_id usando el slug
  const { data: companyLink, isLoading: isLoadingLink, error: linkError } = useQuery({
    queryKey: ['companyLink', empresaId],
    queryFn: async () => {
      try {
        if (!empresaId) return null

        console.log('🔍 Buscando link de empresa con slug:', empresaId)
        const { data: link, error: linkError } = await supabase
          .from('company_links')
          .select('empresa_id')
          .eq('slug', empresaId)
          .eq('is_active', true)
          .single()

        if (linkError) throw linkError
        
        if (!link) {
          throw new Error('No se encontró el link de la empresa')
        }

        console.log('✅ Link encontrado:', link)
        return link
      } catch (error) {
        console.error('❌ Error al buscar link:', error)
        throw error
      }
    },
    enabled: !!empresaId
  })

  // Luego, buscar la información de la empresa usando el empresa_id
  const { data: organization, isLoading: isLoadingOrg, error: orgError } = useQuery({
    queryKey: ['organization', companyLink?.empresa_id],
    queryFn: async () => {
      try {
        if (!companyLink?.empresa_id) return null

        console.log('🔍 Buscando empresa con ID:', companyLink.empresa_id)
        const { data: org, error: orgError } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', companyLink.empresa_id)
          .eq('is_active', true)
          .single()

        if (orgError) throw orgError
        
        if (!org) {
          throw new Error('No se encontró la empresa')
        }

        console.log('✅ Empresa encontrada:', org)
        return org
      } catch (error) {
        console.error('❌ Error al cargar la empresa:', error)
        throw error
      }
    },
    enabled: !!companyLink?.empresa_id
  })

  const value = useMemo(() => ({
    organization: organization || null,
    isLoading: isLoadingLink || isLoadingOrg,
    error: linkError || orgError || null
  }), [organization, isLoadingLink, isLoadingOrg, linkError, orgError])

  return (
    <ClientOrganizationContext.Provider value={value}>
      {children}
    </ClientOrganizationContext.Provider>
  )
}

export function useClientOrganizationContext() {
  const context = useContext(ClientOrganizationContext)
  if (context === undefined) {
    throw new Error('useClientOrganizationContext debe ser usado dentro de un ClientOrganizationProvider')
  }
  return context
} 