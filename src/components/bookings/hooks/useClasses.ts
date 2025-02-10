"use client"

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import { useCurrentEmpresa } from '@/hooks/useCurrentEmpresa'
import { queryKeys } from '@/config/query-keys'
import { keepPreviousData } from '@tanstack/react-query'

interface UseClassesProps {
  branchId?: string
}

// Definir el tipo base primero
type BaseClass = Database['public']['Tables']['classes']['Row']

// Extender el tipo base
interface ClassWithLink extends BaseClass {
  shareableLink: string | null
  empresa?: {
    id: string
    name: string
    company_links?: Array<{
      slug: string
    }>
  }
}

async function fetchClasses(empresaId: string, branchId?: string) {
  const supabase = createClientComponentClient<Database>()
  
  try {
    console.log('🔍 Iniciando carga de clases...', { empresaId, branchId })

    // 1. Obtener el company_link de la empresa
    const { data: companyLink, error: linkError } = await supabase
      .from('company_links')
      .select('slug')
      .eq('type', 'classes')
      .eq('empresa_id', empresaId)
      .eq('is_active', true)
      .single()

    if (linkError && linkError.code !== 'PGRST116') {
      console.error('⚠️ Error al obtener company_link:', linkError)
    }

    // 2. Consulta principal de clases
    let query = supabase
      .from('classes')
      .select(`
        *,
        empresa:empresa_id (
          id,
          name,
          company_links (
            slug
          )
        )
      `)
      .eq('empresa_id', empresaId)

    // 3. Aplicar filtro por sede si existe
    if (branchId) {
      console.log('🔍 Filtrando por sede:', branchId)
      query = query.eq('branch_id', branchId)
    }

    const { data: classesData, error: classesError } = await query
      .order('created_at', { ascending: false })

    if (classesError) {
      console.error('❌ Error al cargar las clases:', classesError)
      throw new Error(`Error al cargar las clases: ${classesError.message}`)
    }

    if (!classesData) {
      console.log('ℹ️ No se encontraron clases para la empresa:', empresaId)
      return []
    }

    // 4. Agregar el link a cada clase
    const classesWithLinks = classesData.map(classItem => {
      const companySlug = classItem.empresa?.company_links?.[0]?.slug || companyLink?.slug
      
      return {
        ...classItem,
        shareableLink: companySlug 
          ? `${window.location.origin}/clases/${companySlug}/${classItem.id}`
          : null
      }
    }) as ClassWithLink[]

    console.log('✅ Clases cargadas:', {
      empresaId,
      branchId,
      count: classesWithLinks.length
    })

    return classesWithLinks
  } catch (error) {
    console.error('❌ Error en fetchClasses:', error)
    throw error
  }
}

export function useClasses({ branchId }: UseClassesProps = {}) {
  const { empresa, isLoading: isLoadingEmpresa } = useCurrentEmpresa()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.classes.list({ branchId, empresaId: empresa?.id }),
    queryFn: () => {
      if (!empresa?.id) throw new Error('No se encontró la empresa asociada')
      return fetchClasses(empresa.id, branchId)
    },
    enabled: !isLoadingEmpresa && !!empresa?.id,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  })

  // Prefetch de la siguiente página o datos relacionados
  const prefetchRelatedData = async () => {
    if (!empresa?.id) return

    // Ejemplo: Prefetch de todas las clases si estamos viendo una sede específica
    if (branchId) {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.classes.list({ empresaId: empresa.id }),
        queryFn: () => fetchClasses(empresa.id),
      })
    }
  }

  return {
    ...query,
    prefetchRelatedData,
    data: query.data || [],
  }
} 