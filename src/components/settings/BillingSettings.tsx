"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { MercadoPagoLogo } from "@/components/icons/mercadopago-logo"
import { StripeLogo } from "@/components/icons/stripe-logo"
import { NewBankAccountModal } from "@/components/settings/NewBankAccountModal"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrganization } from "@/contexts/OrganizationContext"
import { motion } from "framer-motion"

interface BillingConfig {
  mercadoPagoConnected: boolean
  bankAccountConnected: boolean
}

interface StripeConnection {
  id: string
  empresa_id: string
  stripe_account_id: string
  account_type: string
  account_status: string
  created_at: string
  updated_at: string
  account_details?: {
    business_type?: string
    charges_enabled?: boolean
    payouts_enabled?: boolean
    requirements?: {
      currently_due: string[]
      eventually_due: string[]
      past_due: string[]
    }
  }
  stripe_account_email: string
}

export function BillingSettings() {
  const { user } = useAuth()
  const { organization } = useOrganization()
  const { toast } = useToast()
  const [config, setConfig] = useState<BillingConfig>({
    mercadoPagoConnected: false,
    bankAccountConnected: false
  })
  const [showBankModal, setShowBankModal] = useState(false)

  // Consulta para obtener la información de la cuenta de Stripe
  const { data: stripeConnection, isLoading: isLoadingStripe } = useQuery<StripeConnection>({
    queryKey: ['stripeConnection', organization?.id],
    queryFn: async () => {
      try {
        if (!organization?.id) {
          throw new Error('No hay organización seleccionada')
        }
        
        console.log('📍 Consultando conexión de Stripe para empresa:', organization.id)
        const response = await fetch(`/api/stripe/connection/${organization.id}`)
        
        if (!response.ok) {
          throw new Error(`Error al cargar la información de Stripe: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('✅ Datos de conexión Stripe recibidos:', data)
        
        if (!data) {
          return null
        }
        
        return data
      } catch (error) {
        console.error('❌ Error fetching Stripe connection:', error)
        throw error
      }
    },
    enabled: !!organization?.id
  })

  const handleInputChange = (field: keyof BillingConfig, value: boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStripeConnect = async () => {
    try {
      if (!organization?.id) {
        toast({
          title: "Error",
          description: "No se encontró la empresa asociada",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: organization.id
        })
      })

      if (!response.ok) throw new Error('Error al conectar con Stripe')

      const data = await response.json()
      window.location.href = data.url
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo iniciar la conexión con Stripe",
        variant: "destructive"
      })
    }
  }

  const handleStripeDisconnect = async () => {
    try {
      const response = await fetch(`/api/stripe/disconnect/${stripeConnection?.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al desconectar Stripe')

      toast({
        title: "Éxito",
        description: "Cuenta de Stripe desconectada correctamente"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo desconectar la cuenta de Stripe",
        variant: "destructive"
      })
    }
  }

  const hasPendingRequirements = stripeConnection?.account_details?.requirements?.currently_due && 
    stripeConnection.account_details.requirements.currently_due.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-start">
          <h3 className="text-xl font-medium">Integración de Stripe</h3>
        </div>

        <div className="p-0 mt-4">
          {isLoadingStripe ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-2 leading-relaxed">
                {stripeConnection 
                  ? "Tu cuenta de Stripe está conectada y lista para procesar pagos."
                  : "Conecta Stripe para procesar pagos con tarjeta y más métodos."}
              </p>

              {stripeConnection && (
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    Cuenta: {stripeConnection.stripe_account_email}
                  </p>
                  <p className="text-gray-600">
                    Estado: {stripeConnection.account_status}
                  </p>
                  {hasPendingRequirements && (
                    <div className="text-amber-600">
                      <p>Requisitos pendientes: {stripeConnection.account_details?.requirements?.currently_due?.length}</p>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-amber-600 hover:text-amber-700"
                        onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                      >
                        Completar requisitos →
                      </Button>
                    </div>
                  )}

                  <Button 
                    className="mt-2 text-black font-medium p-0 h-auto"
                    variant="link"
                    onClick={handleStripeDisconnect}
                  >
                    Desconectar
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

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

      <NewBankAccountModal 
        open={showBankModal}
        onOpenChange={setShowBankModal}
        onConfirm={() => handleInputChange('bankAccountConnected', true)}
      />
    </motion.div>
  )
} 