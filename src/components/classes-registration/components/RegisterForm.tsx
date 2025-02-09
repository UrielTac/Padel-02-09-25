"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { IconArrowLeft, IconMail, IconLock, IconUser, IconPhone, IconLoader2 } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useClassRegistration } from '../context'
import { StepHeader } from '../shared/StepSection'
import type { Database } from '@/types/supabase'

interface RegisterFormProps {
  onBack: () => void
  onSuccess: () => void
}

interface RegisterFormData {
  email: string
  password: string
  nombre: string
  telefono: string
}

export function RegisterForm({ onBack, onSuccess }: RegisterFormProps) {
  const { organization } = useClassRegistration()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    nombre: '',
    telefono: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization) {
      toast.error('No se encontró la información de la organización')
      return
    }

    setIsLoading(true)
    const supabase = createClientComponentClient<Database>()

    try {
      // 1. Registrar usuario en Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nombre: formData.nombre,
            role: 'client'
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (signUpError) {
        throw new Error(signUpError.message)
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario')
      }

      // 2. Crear vinculación entre usuario y empresa
      const { error: linkError } = await supabase
        .from('vinculaciones')
        .insert({
          user_id: authData.user.id,
          empresa_id: organization.id,
          estado: 'activo',
          metadata: {
            role: 'client',
            created_through: 'class_registration'
          }
        })

      if (linkError) {
        throw new Error('Error al vincular usuario con la empresa')
      }

      toast.success('Cuenta creada exitosamente. Por favor, verifica tu correo electrónico.')
      onSuccess()
    } catch (error: any) {
      console.error('Error al registrar usuario:', error)
      
      // Mostrar mensaje de error específico según el tipo de error
      if (error.message.includes('duplicate key')) {
        toast.error('Ya existe una cuenta con este correo electrónico')
      } else {
        toast.error(error.message || 'Error al crear la cuenta. Por favor, intenta de nuevo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center gap-1"
        >
          <IconArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
      </div>

      <StepHeader 
        title="Crear cuenta"
        subtitle="Regístrate para continuar"
        className="mb-8"
      />

      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre completo */}
            <div className="space-y-1.5">
              <label htmlFor="nombre" className="text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconUser className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  className={cn(
                    "block w-full pl-9 pr-3 py-2 text-sm rounded-md",
                    "bg-white border border-gray-200",
                    "focus:ring-1 focus:ring-gray-200 focus:border-gray-400",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "placeholder:text-gray-400"
                  )}
                  placeholder="Tu nombre"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconMail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={cn(
                    "block w-full pl-9 pr-3 py-2 text-sm rounded-md",
                    "bg-white border border-gray-200",
                    "focus:ring-1 focus:ring-gray-200 focus:border-gray-400",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "placeholder:text-gray-400"
                  )}
                  placeholder="correo@ejemplo.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <label htmlFor="telefono" className="text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconPhone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  className={cn(
                    "block w-full pl-9 pr-3 py-2 text-sm rounded-md",
                    "bg-white border border-gray-200",
                    "focus:ring-1 focus:ring-gray-200 focus:border-gray-400",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "placeholder:text-gray-400"
                  )}
                  placeholder="+1234567890"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconLock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className={cn(
                    "block w-full pl-9 pr-3 py-2 text-sm rounded-md",
                    "bg-white border border-gray-200",
                    "focus:ring-1 focus:ring-gray-200 focus:border-gray-400",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "placeholder:text-gray-400"
                  )}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full flex items-center justify-center",
                "px-4 py-2 rounded-md",
                "bg-gray-900 text-white",
                "text-sm font-medium",
                "hover:bg-gray-800",
                "focus:outline-none focus:ring-2 focus:ring-gray-900/10",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors duration-200"
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <span>Crear cuenta</span>
              )}
            </motion.button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">o</span>
            </div>
          </div>

          {/* Botón de Google */}
          <button
            type="button"
            onClick={() => toast.info('Funcionalidad en desarrollo')}
            className={cn(
              "w-full flex items-center justify-center gap-2",
              "px-4 py-2 rounded-md",
              "bg-white text-gray-700 border border-gray-200",
              "text-sm font-medium",
              "hover:bg-gray-50",
              "focus:outline-none focus:ring-2 focus:ring-gray-200",
              "transition-colors duration-200"
            )}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Continuar con Google</span>
          </button>
        </motion.div>
      </div>
    </>
  )
} 