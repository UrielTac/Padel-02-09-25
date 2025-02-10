"use client"

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'
import { useCurrentEmpresa } from '@/hooks/useCurrentEmpresa'
import { queryKeys } from '@/config/query-keys'

interface UseCompanyLinkProps {
  branchId?: string
  classId?: string
}

interface CompanyLink {
  slug: string
  url: string
  hasExistingLink: boolean
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    // Reemplazar espacios y caracteres especiales por guiones
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    // Eliminar acentos
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

async function fetchCompanyLink(empresaId: string, branchId?: string): Promise<CompanyLink | null> {
  const supabase = createClientComponentClient<Database>()

  try {
    // Verificar si existe un link
    const { data: existingLink, error } = await supabase
      .from('company_links')
      .select('slug')
      .eq('empresa_id', empresaId)
      .eq('type', 'classes')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (!existingLink) {
      return null
    }

    return {
      slug: existingLink.slug,
      url: `${window.location.origin}/clases/${existingLink.slug}`,
      hasExistingLink: true
    }
  } catch (err) {
    console.error('Error al obtener el link de la empresa:', err)
    throw err
  }
}

async function getUniqueSlug(supabase: ReturnType<typeof createClientComponentClient<Database>>, baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1
  let isUnique = false

  while (!isUnique) {
    const { data } = await supabase
      .from('company_links')
      .select('slug')
      .eq('slug', slug)
      .single()

    if (!data) {
      isUnique = true
    } else {
      slug = `${baseSlug}-${counter}`
      counter++
    }
  }

  return slug
}

async function generateCompanyLinkFn(empresaId: string): Promise<CompanyLink> {
  const supabase = createClientComponentClient<Database>()

  try {
    // Verificar si ya existe un link
    const { data: existingLink } = await supabase
      .from('company_links')
      .select('slug')
      .eq('empresa_id', empresaId)
      .eq('type', 'classes')
      .single()

    if (existingLink) {
      return {
        slug: existingLink.slug,
        url: `${window.location.origin}/clases/${existingLink.slug}`,
        hasExistingLink: true
      }
    }

    // Obtener el nombre de la empresa
    const { data: empresaData, error: empresaError } = await supabase
      .from('empresas')
      .select('name')
      .eq('id', empresaId)
      .single()

    if (empresaError) throw empresaError
    if (!empresaData?.name) throw new Error('No se encontró el nombre de la empresa')

    // Generar slug base y obtener uno único
    const baseSlug = generateSlug(empresaData.name)
    const uniqueSlug = await getUniqueSlug(supabase, baseSlug)

    // Crear el nuevo link
    const { data: newLink, error: createError } = await supabase
      .from('company_links')
      .insert({
        empresa_id: empresaId,
        slug: uniqueSlug,
        type: 'classes',
        is_active: true,
        settings: {
          theme: {
            primary_color: '#000000',
            logo_url: null
          },
          features: {
            allow_guest: true,
            require_auth: false,
            show_prices: true
          },
          restrictions: {
            max_bookings_per_user: null,
            advance_days: null
          }
        }
      })
      .select('slug')
      .single()

    if (createError) throw createError

    return {
      slug: newLink.slug,
      url: `${window.location.origin}/clases/${newLink.slug}`,
      hasExistingLink: true
    }
  } catch (err) {
    console.error('Error al generar el link:', err)
    throw err
  }
}

export function useCompanyLink({ branchId, classId }: UseCompanyLinkProps = {}) {
  const { empresa } = useCurrentEmpresa()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.companyLink.byBranch(branchId || 'default'),
    queryFn: () => {
      if (!empresa?.id) throw new Error('No se encontró la empresa asociada')
      return fetchCompanyLink(empresa.id, branchId)
    },
    enabled: !!empresa?.id,
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60, // 1 hora
  })

  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      if (!empresa?.id) throw new Error('No se encontró la empresa asociada')
      return generateCompanyLinkFn(empresa.id)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.companyLink.byBranch(branchId || 'default'),
        data
      )
      toast.success('Link generado exitosamente')
    },
    onError: (error: Error) => {
      console.error('Error al generar el link:', error)
      toast.error('Error al generar el link')
    }
  })

  const copyToClipboard = async () => {
    if (!query.data?.url) return

    try {
      await navigator.clipboard.writeText(query.data.url)
      toast.success('Link copiado al portapapeles')
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err)
      toast.error('Error al copiar el link')
    }
  }

  return {
    companyLink: query.data?.url || null,
    isLoading: query.isLoading || generateLinkMutation.isPending,
    error: query.error || generateLinkMutation.error,
    copyToClipboard,
    generateLink: generateLinkMutation.mutate,
    hasExistingLink: query.data?.hasExistingLink || false
  }
} 