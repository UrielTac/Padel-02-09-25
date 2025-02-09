"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { IconUser, IconLogout, IconLoader2 } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useClassRegistrationAuth } from '../hooks/useAuth'
import { toast } from 'sonner'

export function UserBadge() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user, signOut, isLoading: authLoading } = useClassRegistrationAuth()

  const handleLogout = useCallback(async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      // Cerrar el menú antes de iniciar el proceso de cierre de sesión
      setIsOpen(false)
      // Intentar cerrar sesión
      await signOut()
      // No necesitamos hacer la redirección aquí ya que se maneja en el contexto
      toast.success('Sesión cerrada correctamente')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      toast.error('Error al cerrar sesión')
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, signOut])

  // Si está cargando o no hay usuario, no mostramos nada
  if (authLoading || !user) {
    return null
  }

  return (
    <div className="absolute top-4 right-4 z-50">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "bg-white border border-gray-200",
          "text-sm text-gray-700",
          "hover:bg-gray-50 hover:border-gray-300",
          "transition-all duration-200",
          "shadow-sm",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        disabled={isLoading}
      >
        <IconUser className="w-4 h-4" />
        <span>{user.name || 'Mi Cuenta'}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute top-full right-0 mt-2",
              "w-64 p-3 rounded-lg",
              "bg-white border border-gray-200",
              "shadow-lg"
            )}
          >
            <div className="space-y-3">
              {/* Información del usuario */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  {user.name || user.email.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500">
                  {user.email}
                </p>
              </div>

              {/* Separador */}
              <div className="h-px bg-gray-200" />

              {/* Botón de cerrar sesión */}
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className={cn(
                  "w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md",
                  "text-xs text-red-600",
                  "hover:bg-red-50",
                  "transition-colors duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <IconLogout className="w-3.5 h-3.5" />
                )}
                <span>{isLoading ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 