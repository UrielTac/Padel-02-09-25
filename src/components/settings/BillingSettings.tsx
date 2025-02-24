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
}

export function BillingSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [config, setConfig] = useState<BillingConfig>({
    mercadoPagoConnected: false,
    bankAccountConnected: false
  })
  const [showBankModal, setShowBankModal] = useState(false)

  // Consulta para obtener la información de la cuenta de Stripe
  const { data: stripeConnection, isLoading: isLoadingStripe } = useQuery<StripeConnection>({
    queryKey: ['stripeConnection', user?.metadata?.empresa_id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/stripe/connection/${user?.metadata?.empresa_id}`)
        if (!response.ok) throw new Error('Error al cargar la información de Stripe')
        return response.json()
      } catch (error) {
        console.error('Error fetching Stripe connection:', error)
        throw error
      }
    },
    enabled: !!user?.metadata?.empresa_id
  })

  const handleInputChange = (field: keyof BillingConfig, value: boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStripeConnect = async () => {
    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: user?.metadata?.empresa_id
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

  const hasPendingRequirements = stripeConnection?.account_details?.requirements?.currently_due?.length > 0

  return (
    <div className="p-6">
      <div className="space-y-8">
        {/* Sección de Stripe */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium">Integraciones de Pago</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Tarjeta de Stripe */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 px-4 pt-6">
                <div className="w-72 h-16 flex items-start">
                  <StripeLogo className="w-24 h-8 text-black" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-6">
                <h4 className="font-medium text-base mb-1.5">Stripe</h4>
                {isLoadingStripe ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                      {stripeConnection 
                        ? "Tu cuenta de Stripe está conectada y lista para procesar pagos."
                        : "Conecta Stripe para procesar pagos con tarjeta y más métodos."}
                    </p>

                    <Button 
                      className="w-full bg-white hover:bg-gray-50 text-gray-700 transition-colors duration-200 font-medium border border-gray-200"
                      variant="default"
                      onClick={() => stripeConnection ? handleStripeDisconnect() : handleStripeConnect()}
                    >
                      {stripeConnection ? (
                        <span className="flex items-center justify-center gap-2">
                          <Icons.unlink className="h-4 w-4" />
                          Desconectar
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Icons.link className="h-4 w-4" />
                          Conectar
                        </span>
                      )}
                    </Button>

                    {stripeConnection && (
                      <div className="w-full mt-4 pt-4 border-t space-y-3">
                        <div className="flex items-center text-sm">
                          <span className="flex items-center text-green-600">
                            <Icons.check className="mr-1 h-4 w-4" />
                            Conexión activa
                          </span>
                        </div>
                        
                        {stripeConnection.account_details && (
                          <div className="space-y-2 text-sm">
                            <p className="text-gray-600">
                              Tipo de cuenta: {stripeConnection.account_details.business_type}
                            </p>
                            <p className="text-gray-600">
                              Estado: {stripeConnection.account_status}
                            </p>
                            {hasPendingRequirements && (
                              <div className="text-amber-600">
                                <p>Requisitos pendientes: {stripeConnection.account_details.requirements?.currently_due?.length}</p>
                                <Button
                                  variant="link"
                                  className="h-auto p-0 text-amber-600 hover:text-amber-700"
                                  onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                                >
                                  Completar requisitos →
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tarjeta de Mercado Pago */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 px-4 pt-6">
                <div className="w-72 h-16 flex items-start -ml-5">
                  <MercadoPagoLogo className="[&_.cls-1]:fill-black w-full h-full" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-6">
                <h4 className="font-medium text-base mb-1.5">Mercado Pago</h4>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  {config.mercadoPagoConnected 
                    ? "Tu cuenta de Mercado Pago está conectada y lista para recibir pagos."
                    : "Conecta tu cuenta de Mercado Pago para empezar a recibir pagos en línea."}
                </p>

                <Button 
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 transition-colors duration-200 font-medium border border-gray-200"
                  variant="default"
                  onClick={() => handleInputChange('mercadoPagoConnected', !config.mercadoPagoConnected)}
                >
                  {config.mercadoPagoConnected ? (
                    <span className="flex items-center justify-center gap-2">
                      <Icons.unlink className="h-4 w-4" />
                      Desconectar
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Icons.link className="h-4 w-4" />
                      Conectar
                    </span>
                  )}
                </Button>

                {config.mercadoPagoConnected && (
                  <div className="w-full mt-4 pt-4 border-t">
                    <div className="flex items-center text-sm">
                      <span className="flex items-center text-green-600">
                        <Icons.check className="mr-1 h-4 w-4" />
                        Conexión activa
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Nueva carta de Cuenta Bancaria */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 px-4 pt-6">
                <div className="w-72 h-16 flex items-start">
                  <Icons.bank className="w-12 h-12 text-black pt-2" strokeWidth={1.1} />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-6">
                <h4 className="font-medium text-base mb-1.5">Cuenta de Banco o Pago</h4>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  {config.bankAccountConnected 
                    ? "Tu cuenta bancaria/pago está conectada y lista para recibir transferencias."
                    : "Conecta tu cuenta bancaria o de pago para recibir pagos por transferencia."}   
                </p>

                <Button 
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 transition-colors duration-200 font-medium border border-gray-200"
                  variant="default"
                  onClick={() => config.bankAccountConnected 
                    ? handleInputChange('bankAccountConnected', false)
                    : setShowBankModal(true)
                  }
                >
                  {config.bankAccountConnected ? (
                    <span className="flex items-center justify-center gap-2">
                      <Icons.unlink className="h-4 w-4" />
                      Desconectar
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Icons.link className="h-4 w-4" />
                      Conectar
                    </span>
                  )}
                </Button>

                {config.bankAccountConnected && (
                  <div className="w-full mt-4 pt-4 border-t">
                    <div className="flex items-center text-sm">
                      <span className="flex items-center text-green-600">
                        <Icons.check className="mr-1 h-4 w-4" />
                        Conexión activa
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <NewBankAccountModal 
        open={showBankModal}
        onOpenChange={setShowBankModal}
        onConfirm={() => handleInputChange('bankAccountConnected', true)}
      />
    </div>
  )
} 