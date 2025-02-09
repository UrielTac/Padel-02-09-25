"use client"

import { useQuery } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import type { Database } from '@/types/supabase'
import { useCurrentEmpresa } from '@/hooks/useCurrentEmpresa'

// Clave para el caché de React Query
const PACKAGES_CACHE_KEY = 'packages'

interface UsePackagesProps {
  enabled?: boolean
}

// Tipo base para los paquetes
type BasePackage = Database['public']['Tables']['packages']['Row']

// Extender el tipo base con información adicional si es necesario
interface PackageWithMetadata extends BasePackage {
  empresa?: {
    id: string
    name: string
  }
}

export function usePackages({ enabled = true }: UsePackagesProps = {}) {
  const supabase = createClientComponentClient<Database>()
  const { empresa, isLoading: isLoadingEmpresa } = useCurrentEmpresa()

  const query = useQuery({
    queryKey: [PACKAGES_CACHE_KEY, empresa?.id],
    queryFn: async () => {
      try {
        console.log('🔍 Iniciando carga de paquetes...', { empresaId: empresa?.id })

        if (!empresa?.id) {
          throw new Error('No se encontró la empresa asociada')
        }

        // Obtener los paquetes de la empresa
        const { data: packagesData, error: packagesError } = await supabase
          .from('packages')
          .select(`
            *,
            empresa:empresa_id (
              id,
              name
            )
          `)
          .eq('empresa_id', empresa.id)
          .in('status', ['active', 'inactive'])
          .order('created_at', { ascending: false })

        if (packagesError) {
          console.error('❌ Error al cargar los paquetes:', packagesError)
          throw new Error(`Error al cargar los paquetes: ${packagesError.message}`)
        }

        // Si no hay paquetes, retornar array vacío
        if (!packagesData || packagesData.length === 0) {
          console.log('⚠️ No se encontraron paquetes para la empresa:', empresa.id)
          return []
        }

        // Procesar los paquetes
        const validPackages = packagesData.map(pkg => ({
          ...pkg,
          class_count: Number(pkg.class_count),
          price: Number(pkg.price),
          expiration_days: Number(pkg.expiration_days),
          advance_booking_days: Number(pkg.advance_booking_days),
          branch_ids: Array.isArray(pkg.branch_ids) ? pkg.branch_ids : [],
          available_payment_methods: Array.isArray(pkg.available_payment_methods) ? pkg.available_payment_methods : []
        })) as PackageWithMetadata[]

        console.log('✅ Paquetes procesados:', {
          empresaId: empresa.id,
          count: validPackages.length,
          packages: validPackages
        })

        return validPackages
      } catch (error) {
        console.error('❌ Error en usePackages:', error)
        throw error
      }
    },
    enabled: enabled && !isLoadingEmpresa && !!empresa?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000)
  })

  const updatePackageStatus = async (packageId: string, newStatus: 'active' | 'inactive' | 'archived') => {
    try {
      if (!empresa?.id) {
        throw new Error('No se encontró la empresa asociada')
      }

      const { error: updateError } = await supabase
        .from('packages')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', packageId)
        .eq('empresa_id', empresa.id)

      if (updateError) throw updateError

      // Invalidar la consulta para refrescar los datos
      await query.refetch()
      
      toast.success(`Paquete ${newStatus === 'archived' ? 'eliminado' : newStatus === 'inactive' ? 'ocultado' : 'visible'} exitosamente`)
    } catch (err) {
      const error = err as Error
      console.error('Error al actualizar el estado del paquete:', error)
      toast.error(error.message || 'Error al actualizar el estado del paquete')
      throw error
    }
  }

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    updatePackageStatus
  }
} 