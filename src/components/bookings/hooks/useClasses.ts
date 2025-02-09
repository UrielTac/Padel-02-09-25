"use client"

import { useQuery } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import { useCurrentEmpresa } from '@/hooks/useCurrentEmpresa'

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

// Clave para el caché de React Query
const CLASSES_CACHE_KEY = 'classes'

export function useClasses({ branchId }: UseClassesProps = {}) {
  const supabase = createClientComponentClient<Database>()
  const { empresa, isLoading: isLoadingEmpresa } = useCurrentEmpresa()

  return useQuery({
    queryKey: [CLASSES_CACHE_KEY, empresa?.id, branchId],
    queryFn: async () => {
      try {
        console.log('🔍 Iniciando carga de clases...', { empresaId: empresa?.id, branchId })

        if (!empresa?.id) {
          throw new Error('No se encontró la empresa asociada')
        }

        // 1. Obtener el company_link de la empresa
        const { data: companyLink, error: linkError } = await supabase
          .from('company_links')
          .select('slug')
          .eq('type', 'classes')
          .eq('empresa_id', empresa.id)
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
          .eq('empresa_id', empresa.id)

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
          console.log('ℹ️ No se encontraron clases para la empresa:', empresa.id)
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
          empresaId: empresa.id,
          branchId,
          count: classesWithLinks.length,
          classes: classesWithLinks
        })

        return classesWithLinks
      } catch (error) {
        console.error('❌ Error en useClasses:', error)
        throw error
      }
    },
    enabled: !isLoadingEmpresa && !!empresa?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  })
} 