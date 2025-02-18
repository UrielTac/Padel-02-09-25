"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PlanInfo } from './PlanInfo'
import { useToast } from "@/components/ui/use-toast"
import { ExternalLink } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useBookingCount } from '@/hooks/useBookingCount'

interface CompanyData {
  name: string
  email: string
  phone: string
  website: string
}

const PAYPAL_SUBSCRIPTION_PORTAL = 'https://www.paypal.com/myaccount/autopay/connect/'

export function CompanySettings() {
  const { toast } = useToast()
  const { user } = useAuth()
  const today = new Date().toISOString().split('T')[0]
  
  // Reutilizamos el hook que ya tenemos para verificar el plan
  const { 
    isPro,
    isLoading: isLoadingPlan 
  } = useBookingCount({ 
    empresaId: user?.metadata?.empresa_id || '', 
    date: today 
  })

  const [formData, setFormData] = useState<CompanyData>({
    name: "Padel Club",
    email: "info@padelclub.com",
    phone: "+34 123 456 789",
    website: "www.padelclub.com"
  })

  const handleInputChange = (field: keyof CompanyData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    console.log("Guardando cambios:", formData)
  }

  const handleManageSubscription = () => {
    window.open(PAYPAL_SUBSCRIPTION_PORTAL, '_blank')
    
    toast({
      title: "Portal de suscripción",
      description: "Se ha abierto el portal de PayPal en una nueva pestaña para gestionar tu suscripción",
      duration: 5000,
    })
  }

  return (
    <div className="space-y-8">
      {/* Sección de información del plan */}
      <div className="space-y-6">
        <PlanInfo />
      </div>

      {/* Sección de gestión de suscripción - Solo visible para planes PRO */}
      {isPro && !isLoadingPlan && (
        <div className="max-w-[800px] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium">Gestión de Suscripción</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <h4 className="text-sm font-medium text-gray-900">
                Gestionar suscripción
              </h4>
              <p className="text-sm text-gray-500">
                Puedes gestionar tu suscripción, incluyendo la cancelación, directamente desde tu cuenta de PayPal
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              className="w-fit gap-2 text-gray-600 hover:text-gray-700"
            >
              Ir al portal de PayPal
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Información de la empresa */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-medium">Información de la Empresa</h3>
        </div>

        <div className="max-w-[800px] space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-600">
                  Nombre de la empresa
                </label>
                <input
                  type="text"
                  placeholder="Ej: Padel Club"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg",
                    "border border-gray-200 bg-white",
                    "focus:outline-none focus:border-gray-300",
                    "transition-colors duration-200",
                    "placeholder:text-gray-400",
                    "text-sm"
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  placeholder="Ej: info@padelclub.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg",
                    "border border-gray-200 bg-white",
                    "focus:outline-none focus:border-gray-300",
                    "transition-colors duration-200",
                    "placeholder:text-gray-400",
                    "text-sm"
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-600">
                  Teléfono
                </label>
                <input
                  type="tel"
                  placeholder="Ej: +34 123 456 789"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg",
                    "border border-gray-200 bg-white",
                    "focus:outline-none focus:border-gray-300",
                    "transition-colors duration-200",
                    "placeholder:text-gray-400",
                    "text-sm"
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600">
                  Sitio web
                </label>
                <input
                  type="text"
                  placeholder="Ej: www.padelclub.com"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg",
                    "border border-gray-200 bg-white",
                    "focus:outline-none focus:border-gray-300",
                    "transition-colors duration-200",
                    "placeholder:text-gray-400",
                    "text-sm"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-start pt-2">
            <Button 
              onClick={handleSave}
              className="bg-black hover:bg-gray-800 text-white transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
            >
              Guardar cambios
            </Button>
          </div>

          {/* Sección de ayuda */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-900">
                ¿Necesitas ayuda?
              </p>
              <div className="text-sm text-gray-500">
                <p>Contáctenos en:</p>
                <div className="mt-1 space-y-1">
                  <p className="text-gray-600">
                    <a 
                      href="mailto:soportesimplelink@gmail.com"
                      className="hover:text-gray-900 transition-colors"
                    >
                      soportesimplelink@gmail.com
                    </a>
                  </p>
                  <p className="text-gray-600">
                    <a 
                      href="https://www.simple-link.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-gray-900 transition-colors"
                    >
                      www.simple-link.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 