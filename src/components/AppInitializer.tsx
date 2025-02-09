"use client"

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppStore } from '@/store/appStore'
import { useRouter } from 'next/navigation'

interface AppInitializerProps {
  children: React.ReactNode
}

export function AppInitializer({ children }: AppInitializerProps) {
  const { user, isLoading: isLoadingAuth } = useAuth()
  const { 
    isInitialized,
    isLoading: isLoadingApp,
    initialize,
    reset
  } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    const initializeApp = async () => {
      if (!user?.id) return

      if (!isInitialized) {
        await initialize(user.id)
      }
    }

    if (!isLoadingAuth) {
      if (user) {
        void initializeApp()
      } else {
        reset()
        router.push('/admin/login')
      }
    }
  }, [user, isLoadingAuth, isInitialized, initialize, reset, router])

  // Mostrar estado de carga mientras se inicializa
  if (isLoadingAuth || isLoadingApp) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  // Si no hay usuario autenticado, no renderizar nada
  if (!user) return null

  // Si la app no está inicializada y no está cargando, mostrar error
  if (!isInitialized && !isLoadingApp) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error al inicializar la aplicación</div>
      </div>
    )
  }

  return <>{children}</>
} 