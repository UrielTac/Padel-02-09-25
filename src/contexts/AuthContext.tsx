"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import type { AuthError, AdminUser, ClientUser, BaseAuthSession } from '@/types/supabase-auth'
import { AUTH_CONFIG } from '@/config/auth.config'
import { useAppStore } from '@/store/appStore'
import { clearAllStorage } from '@/lib/storage-utils'

interface AuthUserMetadata {
  name: string
  avatar_url?: string
  empresa_id?: string
  provider?: string
  providers?: string[]
}

interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'staff' | 'client'
  metadata: AuthUserMetadata
  app_metadata: {
    role: 'admin' | 'staff'
    provider?: string
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

const BROADCAST_EVENTS = {
  SESSION_UPDATED: 'SESSION_UPDATED',
  SESSION_CLEARED: 'SESSION_CLEARED',
  TAB_INITIALIZED: 'TAB_INITIALIZED',
  TAB_CLOSED: 'TAB_CLOSED'
} as const

const AUTH_SESSION_CHECK_INTERVAL = 1000 * 60 * 5 // 5 minutos
const SESSION_CHECK_KEY = 'last_session_check'

// Función para verificar si necesitamos comprobar la sesión
function shouldCheckSession(): boolean {
  if (typeof window === 'undefined') return true
  
  const lastCheck = localStorage.getItem(SESSION_CHECK_KEY)
  const storedSession = localStorage.getItem(AUTH_CONFIG.admin.storage.keys.session)
  
  // Si no hay sesión almacenada, siempre verificar
  if (!storedSession) return true
  
  // Si no hay último check, verificar
  if (!lastCheck) return true
  
  // Verificar el tiempo transcurrido
  const timeSinceLastCheck = Date.now() - parseInt(lastCheck)
  return timeSinceLastCheck > AUTH_SESSION_CHECK_INTERVAL
}

// Función para actualizar el timestamp de la última verificación
function updateLastSessionCheck() {
  localStorage.setItem(SESSION_CHECK_KEY, Date.now().toString())
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseClient()
  
  // Referencias para el canal y el ID de pestaña
  const authChannelRef = useRef<BroadcastChannel | null>(null)
  const tabIdRef = useRef<string>(Math.random().toString(36).slice(2))

  // Función para obtener o crear el canal de manera segura
  const getAuthChannel = useCallback(() => {
    if (typeof window === 'undefined') return null
    
    try {
      if (!authChannelRef.current) {
        authChannelRef.current = new BroadcastChannel('auth_channel')
      }
      return authChannelRef.current
    } catch (error) {
      console.error('Error al crear BroadcastChannel:', error)
      return null
    }
  }, [])

  // Función para enviar mensajes de manera segura
  const sendMessage = useCallback((message: any) => {
    try {
      const channel = getAuthChannel()
      if (channel) {
        // Verificar si el canal está disponible antes de enviar
        if (!channel.dispatchEvent(new Event('test'))) {
          console.warn('Canal no disponible')
          return
        }
        channel.postMessage(message)
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
    }
  }, [getAuthChannel])

  // Función para persistir la sesión
  const persistSession = useCallback((authSession: AuthSession) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(AUTH_CONFIG.admin.storage.keys.session, JSON.stringify(authSession))
        sendMessage({ 
          type: BROADCAST_EVENTS.SESSION_UPDATED, 
          session: authSession,
          tabId: tabIdRef.current
        })
      } catch (error) {
        console.error('Error al persistir sesión:', error)
      }
    }
  }, [sendMessage])

  // Función para limpiar la sesión
  const clearSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(AUTH_CONFIG.admin.storage.keys.session)
        sendMessage({ 
          type: BROADCAST_EVENTS.SESSION_CLEARED,
          tabId: tabIdRef.current
        })
      } catch (error) {
        console.error('Error al limpiar sesión:', error)
      }
    }
  }, [sendMessage])

  // Definir signOut antes del useEffect que lo usa
  const signOut = useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)
      
      // 1. Limpiar el estado de la aplicación usando appStore
      const appStore = useAppStore.getState()
      appStore.reset()

      // 2. Limpiar todo el almacenamiento
      clearAllStorage()

      // 3. Limpiar cookies
      const cookiesToRemove = [
        AUTH_CONFIG.admin.cookies.name,
        'sb-admin-auth-token',
        'empresa_id'
      ]

      cookiesToRemove.forEach(cookieName => {
        try {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        } catch (e) {
          console.warn(`Error al limpiar cookie ${cookieName}:`, e)
        }
      })

      // 4. Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // 5. Limpiar estado del contexto
      clearSession()
      setUser(null)
      setSession(null)
      
      // 6. Enviar mensaje de broadcast para otras pestañas
      sendMessage({ 
        type: BROADCAST_EVENTS.SESSION_CLEARED,
        tabId: tabIdRef.current
      })

      // 7. Forzar recarga de la página para limpiar cualquier estado residual
      window.location.href = '/admin/login'
      
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      setError(error as AuthError)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [supabase, clearSession, sendMessage])

  // Función para verificar la sesión
  const checkSession = useCallback(async () => {
    try {
      // Intentar recuperar la sesión del localStorage primero
      const storedSession = localStorage.getItem(AUTH_CONFIG.admin.storage.keys.session)
      
      // Si hay una sesión almacenada y no necesitamos verificar, usarla
      if (storedSession && !shouldCheckSession()) {
        const parsedSession = JSON.parse(storedSession) as AuthSession
        setSession(parsedSession)
        setUser(parsedSession.user)
        setIsLoading(false)
        setIsInitialized(true)
        return
      }

      // Si llegamos aquí, necesitamos verificar la sesión con Supabase
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError

      if (currentSession?.user) {
        const role = currentSession.user.app_metadata?.role || 'client'
        
        // Verificar si el usuario es admin
        if (role !== 'admin') {
          await signOut()
          throw new Error('No tienes permisos de administrador')
        }

        // Crear el objeto de usuario autenticado
        const authUser: AuthUser = {
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          role: 'admin',
          app_metadata: {
            role: 'admin',
            provider: currentSession.user.app_metadata?.provider
          },
          metadata: {
            name: currentSession.user.user_metadata?.full_name || 
                  currentSession.user.user_metadata?.name || 
                  currentSession.user.email?.split('@')[0] || 
                  'Usuario',
            avatar_url: currentSession.user.user_metadata?.avatar_url || 
                       currentSession.user.user_metadata?.picture,
            empresa_id: currentSession.user.app_metadata?.empresa_id,
            provider: currentSession.user.app_metadata?.provider,
            providers: currentSession.user.app_metadata?.providers
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
        persistSession(authSession)
        updateLastSessionCheck()
      } else {
        // Si no hay sesión, limpiar todo
        clearSession()
        setUser(null)
        setSession(null)
      }
      
      setIsLoading(false)
      setIsInitialized(true)
    } catch (error) {
      console.error('Error al verificar sesión:', error)
      setError(error as AuthError)
      clearSession()
      setIsLoading(false)
      setIsInitialized(true)
    }
  }, [supabase, persistSession, clearSession, signOut])

  // Efecto para verificar y restaurar la sesión
  useEffect(() => {
    if (!isInitialized) {
      checkSession()
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_IN') {
        console.log('�� Sesión iniciada')
        await checkSession()
      } else if (event === 'SIGNED_OUT') {
        clearSession()
        setUser(null)
        setSession(null)
      }
      
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [checkSession, clearSession, isInitialized])

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
          email: data.user.email || '',
          role: data.user.app_metadata?.role || 'client',
          app_metadata: {
            role: data.user.app_metadata?.role || 'admin',
            provider: data.user.app_metadata?.provider
          },
          metadata: {
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Usuario',
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
        persistSession(authSession)
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
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile'
        }
      })

      if (error) throw error

    } catch (error: any) {
      console.error('Error en inicio de sesión con Google:', error)
      setError(error as AuthError)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Función para verificar y actualizar el rol de administrador
  const verifyAndUpdateAdminRole = async (user: AuthUser) => {
    try {
      // Verificar si ya tiene rol de admin
      if (user.app_metadata?.role === 'admin') {
        return true
      }

      // Si no tiene rol, intentar actualizar a admin
      const { data: { user: updatedUser }, error } = await supabase.auth.updateUser({
        data: {
          role: 'admin',
          provider: 'google',
          providers: ['google']
        }
      })

      if (error) throw error
      return updatedUser.app_metadata?.role === 'admin'

    } catch (error) {
      console.error('Error al verificar/actualizar rol:', error)
      return false
    }
  }

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