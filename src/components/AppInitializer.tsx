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
  const { initialize, reset } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    const initializeApp = async () => {
      if (!user?.id) return
      await initialize(user.id)
    }

    if (!isLoadingAuth) {
      if (user?.role === 'admin') {
        void initializeApp()
      } else {
        reset()
        router.push('/admin/login')
      }
    }
  }, [user, isLoadingAuth, initialize, reset, router])

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  // Si no hay usuario admin autenticado, no renderizar nada
  if (!user || user.role !== 'admin') return null

  return <>{children}</>
} 