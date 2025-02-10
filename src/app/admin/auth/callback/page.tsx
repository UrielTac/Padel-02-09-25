'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const { clearError } = useAuth()

  useEffect(() => {
    let isMounted = true

    const handleCallback = async () => {
      try {
        clearError()
        
        // 1. Verificar errores de OAuth
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          throw new Error(errorDescription || 'Error en la autenticación con Google')
        }

        // 2. Obtener y validar la sesión
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!session?.user) throw new Error('No se encontró sesión de usuario')

        // 3. Verificar el rol en raw_app_meta_data
        const userRole = session.user.app_metadata?.role
        if (userRole !== 'admin') {
          throw new Error('No tienes permisos de administrador')
        }

        // 4. Actualizar metadatos de autenticación si es necesario
        if (!session.user.app_metadata?.provider || session.user.app_metadata?.provider !== 'google') {
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              role: 'admin',
              provider: 'google',
              providers: ['google']
            }
          })
          if (updateError) throw updateError
        }

        // 5. Redirigir al dashboard - AuthContext se encargará de la sesión
        if (isMounted) {
          router.push('/admin/dashboard')
        }
      } catch (error: any) {
        console.error('Error en callback:', error)
        if (isMounted) {
          await supabase.auth.signOut()
          router.push('/admin/login?error=callback&message=' + encodeURIComponent(error.message))
        }
      }
    }

    handleCallback()

    return () => {
      isMounted = false
    }
  }, [router, searchParams, supabase, clearError])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Verificando credenciales...
        </p>
      </div>
    </div>
  )
} 