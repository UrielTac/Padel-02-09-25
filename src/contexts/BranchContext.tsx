"use client"

import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { Branch } from '@/types/branch'
import { createSupabaseClient } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { setEmpresaId } from '@/contexts/OrganizationContext'
import { toast } from 'sonner'

interface BranchContextType {
  currentBranch: Branch | null
  setCurrentBranch: (branch: Branch | null) => void
  branches: Branch[]
  isLoading: boolean
  error: Error | null
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

const BRANCH_STORAGE_KEY = 'currentBranchId'

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isLoadingAuth } = useAuth()
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(() => {
    // Intentar recuperar la sede del localStorage al inicio
    if (typeof window !== 'undefined') {
      const savedBranchId = localStorage.getItem(BRANCH_STORAGE_KEY)
      return savedBranchId ? { id: savedBranchId } as Branch : null
    }
    return null
  })
  const supabase = createSupabaseClient()

  // Query para obtener la empresa del usuario actual
  const { 
    data: empresa,
    isLoading: isLoadingEmpresa,
    error: empresaError
  } = useQuery({
    queryKey: ['empresa', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No hay usuario autenticado')

      console.log('🔍 Buscando empresa para usuario:', user.id)
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (error) throw error
      if (!data) throw new Error('No se encontró la empresa')

      console.log('✅ Empresa encontrada:', data.id)
      // Guardar el empresa_id en caché
      setEmpresaId(data.id)
      return data
    },
    enabled: !!user?.id && !isLoadingAuth,
    retry: 1,
    staleTime: 1000 * 60 * 5 // 5 minutos
  })

  // Query para obtener las sedes
  const { 
    data: branchesData = [], 
    isLoading: isLoadingBranches,
    error: branchesError
  } = useQuery({
    queryKey: ['branches', empresa?.id],
    queryFn: async () => {
      if (!empresa?.id) throw new Error('No hay empresa seleccionada')

      console.log('🔍 Buscando sedes para empresa:', empresa.id)
      const { data, error } = await supabase
        .from('sedes')
        .select('*')
        .eq('empresa_id', empresa.id)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error al cargar sedes:', error)
        toast.error('Error al cargar las sedes')
        throw error
      }
      
      if (!data?.length) {
        console.warn('No hay sedes disponibles')
        return []
      }

      console.log('✅ Sedes encontradas:', data.length)
      return data as Branch[]
    },
    enabled: !!empresa?.id && !isLoadingAuth && !isLoadingEmpresa,
    retry: 1,
    staleTime: 1000 * 60 * 5 // 5 minutos
  })

  // Efecto para manejar la sede actual
  useEffect(() => {
    const initializeBranch = () => {
      // Solo proceder si tenemos todas las dependencias necesarias
      if (isLoadingAuth || isLoadingEmpresa || isLoadingBranches) {
        console.log('⏳ Esperando carga de dependencias...')
        return
      }

      // Si no hay usuario o empresa, limpiar la sede
      if (!user || !empresa) {
        console.log('🧹 Limpiando sede actual (no hay usuario o empresa)')
        setCurrentBranch(null)
        localStorage.removeItem(BRANCH_STORAGE_KEY)
        return
      }

      // Si no hay sedes disponibles, limpiar la sede
      if (!branchesData.length) {
        console.log('🧹 Limpiando sede actual (no hay sedes disponibles)')
        setCurrentBranch(null)
        localStorage.removeItem(BRANCH_STORAGE_KEY)
        return
      }

      // Intentar usar la sede guardada
      const savedBranchId = localStorage.getItem(BRANCH_STORAGE_KEY)
      if (savedBranchId) {
        const savedBranch = branchesData.find(branch => branch.id === savedBranchId)
        if (savedBranch) {
          console.log('✅ Usando sede guardada:', savedBranch.name)
          setCurrentBranch(savedBranch)
          return
        }
      }

      // Si no hay sede guardada o no es válida, usar la primera
      console.log('ℹ️ Usando primera sede disponible:', branchesData[0].name)
      setCurrentBranch(branchesData[0])
      localStorage.setItem(BRANCH_STORAGE_KEY, branchesData[0].id)
    }

    initializeBranch()
  }, [user, empresa, branchesData, isLoadingAuth, isLoadingEmpresa, isLoadingBranches])

  // Manejar cambios en la sede actual
  const handleSetCurrentBranch = (branch: Branch | null) => {
    console.log('🔄 Cambiando sede actual:', branch?.name || 'ninguna')
    setCurrentBranch(branch)
    
    if (branch) {
      localStorage.setItem(BRANCH_STORAGE_KEY, branch.id)
    } else {
      localStorage.removeItem(BRANCH_STORAGE_KEY)
    }
  }

  const value = useMemo(() => ({
    currentBranch,
    setCurrentBranch: handleSetCurrentBranch,
    branches: branchesData,
    isLoading: isLoadingAuth || isLoadingEmpresa || isLoadingBranches,
    error: empresaError || branchesError
  }), [
    currentBranch,
    branchesData,
    isLoadingAuth,
    isLoadingEmpresa,
    isLoadingBranches,
    empresaError,
    branchesError
  ])

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  )
}

export function useBranchContext() {
  const context = useContext(BranchContext)
  if (context === undefined) {
    throw new Error('useBranchContext debe ser usado dentro de un BranchProvider')
  }
  return context
} 