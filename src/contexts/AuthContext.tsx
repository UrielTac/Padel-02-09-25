"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient, clearSupabaseClient } from '@/lib/supabase'
import type { AuthError } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Role = 'admin' | 'client'

interface AuthUser {
  id: string
  email: string
  role: string
  metadata: {
    name: string
    avatar_url?: string
    empresa_id?: string
    provider?: string
    providers?: string[]
  }
}

interface AuthSession {
  user: AuthUser
  access_token: string
  refresh_token: string
  expires_at: number
}

interface AuthContextType {
  user: AuthUser | null
  session: AuthSession | null
  isLoading: boolean
  error: AuthError | null
  signIn: (credentials: { email: string; password: string }) => Promise<{ user: AuthUser; session: AuthSession } | null>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [shouldRedirect, setShouldRedirect] = useState<{ path: string; event: string } | null>(null)
  const router = useRouter()
  const supabase = createSupabaseClient()

  // Manejar redirecciones de manera segura
  useEffect(() => {
    if (shouldRedirect) {
      const timer = setTimeout(() => {
        router.push(shouldRedirect.path)
        setShouldRedirect(null)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [shouldRedirect, router])

  useEffect(() => {
    // Verificar si ya hay una sesión activa
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession?.user) {
          // Obtener el rol desde raw_app_meta_data
          const role = currentSession.user.app_metadata?.role || 'client'
          
          // Solo obtener datos adicionales si es necesario
          let userData = null
          if (role === 'admin') {
            const { data, error: userError } = await supabase
              .from('usuarios')
              .select('*')
              .eq('id', currentSession.user.id)
              .single()

            if (userError) throw userError
            if (!data) throw new Error('Usuario no encontrado')
            userData = data
          }

          const authUser: AuthUser = {
            id: currentSession.user.id,
            email: currentSession.user.email!,
            role: role,
            metadata: {
              name: userData?.nombre || currentSession.user.user_metadata?.name || currentSession.user.email!.split('@')[0],
              avatar_url: userData?.avatar_url || currentSession.user.user_metadata?.avatar_url,
            }
          }

          const authSession: AuthSession = {
            user: authUser,
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token,
            expires_at: currentSession.expires_at || 0
          }

          setUser(authUser)
          setSession(authSession)
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error)
        setError(error as AuthError)
        setUser(null)
        setSession(null)
        void supabase.auth.signOut()
      } finally {
        setIsLoading(false)
      }
    }

    void checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      try {
        if (currentSession?.user) {
          // Obtener el rol desde raw_app_meta_data
          const role = currentSession.user.app_metadata?.role || 'client'

          // Solo obtener datos adicionales si es necesario
          let userData = null
          if (role === 'admin') {
            const { data, error: userError } = await supabase
              .from('usuarios')
              .select('*')
              .eq('id', currentSession.user.id)
              .single()

            if (userError) throw userError
            if (!data) throw new Error('Usuario no encontrado')
            userData = data
          }

          const authUser: AuthUser = {
            id: currentSession.user.id,
            email: currentSession.user.email!,
            role: role,
            metadata: {
              name: userData?.nombre || currentSession.user.user_metadata?.name || currentSession.user.email!.split('@')[0],
              avatar_url: userData?.avatar_url || currentSession.user.user_metadata?.avatar_url,
            }
          }

          const authSession: AuthSession = {
            user: authUser,
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token,
            expires_at: currentSession.expires_at || 0
          }

          setUser(authUser)
          setSession(authSession)

          // No realizar redirecciones automáticas aquí
          // Las redirecciones se manejarán en los componentes específicos
        } else {
          setUser(null)
          setSession(null)
          if (event === 'SIGNED_OUT') {
            router.push('/clases/login')
          }
        }
      } catch (error) {
        console.error('Error en cambio de estado de autenticación:', error)
        setError(error as AuthError)
        setUser(null)
        setSession(null)
        void supabase.auth.signOut()
      } finally {
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
      clearSupabaseClient()
    }
  }, [supabase])

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    try {
      setError(null)
      setIsLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user && data.session) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email!,
          role: data.user.app_metadata?.role || 'client',
          metadata: {
            name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
            avatar_url: data.user.user_metadata?.avatar_url,
            empresa_id: data.user.app_metadata?.empresa_id,
            provider: data.user.app_metadata?.provider,
            providers: data.user.app_metadata?.providers
          }
        }

        const authSession: AuthSession = {
          user: authUser,
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at || 0
        }

        setUser(authUser)
        setSession(authSession)
        return { user: authUser, session: authSession }
      }
      return null
    } catch (error) {
      setError(error as AuthError)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setError(null)
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile'
        }
      })

      if (error) throw error
    } catch (error) {
      setError(error as AuthError)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      clearSupabaseClient()
      setUser(null)
      setSession(null)
      
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      setError(error as AuthError)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const clearError = () => setError(null)

  const value = {
    user,
    session,
    isLoading,
    error,
    signIn,
    signInWithGoogle,
    signOut,
    clearError
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
} 