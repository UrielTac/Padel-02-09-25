'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminLoginForm } from '@/components/auth/AdminLoginForm'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function AdminLoginPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')

  useEffect(() => {
    if (!isLoading && user) {
      console.log('✅ Usuario autenticado, redirigiendo...')
      router.replace(returnUrl || '/admin/dashboard/bookings')
    }
  }, [user, isLoading, router, returnUrl])

  // Mostrar estado de carga mientras se verifica la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <LoadingSpinner size="md" />
          <p className="text-sm text-gray-500">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, mostrar el formulario de login
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          </h2>
        </div>
        <AdminLoginForm />
      </div>
    )
  }

  // Este return nunca debería ejecutarse debido al efecto de redirección
  return null
} 