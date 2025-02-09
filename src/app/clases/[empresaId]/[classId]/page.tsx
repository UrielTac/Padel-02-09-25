"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ClassRegistrationProvider, ClassRegistrationForm } from '@/components/classes-registration'
import { LoadingSpinner } from '@/components/classes-registration/shared/LoadingSpinner'

interface Props {
  params: {
    empresaId: string
    classId: string
  }
}

export default function ClassRegistrationPage({ params }: Props) {
  const router = useRouter()
  const { user, isLoading: isLoadingAuth } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  // Efecto para manejar la autenticación
  useEffect(() => {
    if (!isLoadingAuth) {
      if (!user) {
        // Si no hay usuario, redirigir al login con returnUrl
        const currentPath = `/clases/${params.empresaId}/${params.classId}`
        const loginUrl = `/clases/login?returnUrl=${encodeURIComponent(currentPath)}`
        router.push(loginUrl)
      } else {
        // Si hay usuario, permitir la carga del contenido
        setIsLoading(false)
      }
    }
  }, [user, isLoadingAuth, router, params])

  // Estado de carga
  if (isLoading || isLoadingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <LoadingSpinner />
          <p className="text-sm text-gray-500">
            Cargando información...
          </p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, no mostrar nada (la redirección se manejará en el useEffect)
  if (!user) {
    return null
  }

  return (
    <ClassRegistrationProvider empresaId={params.empresaId}>
      <ClassRegistrationForm selectedClassId={params.classId} />
    </ClassRegistrationProvider>
  )
} 