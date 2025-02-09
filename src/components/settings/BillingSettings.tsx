"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { MercadoPagoLogo } from "@/components/icons/mercadopago-logo"
import { NewBankAccountModal } from "@/components/settings/NewBankAccountModal"

interface BillingConfig {
  mercadoPagoConnected: boolean
  bankAccountConnected: boolean
}

export function BillingSettings() {
  const [config, setConfig] = useState<BillingConfig>({
    mercadoPagoConnected: false,
    bankAccountConnected: false
  })

  const [showBankModal, setShowBankModal] = useState(false)

  const handleInputChange = (field: keyof BillingConfig, value: boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="p-6">
      {/* Integración con Mercado Pago */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Integración de pagos</h3>
        <div className="grid md:grid-cols-3 gap-4">
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

      <NewBankAccountModal 
        open={showBankModal}
        onOpenChange={setShowBankModal}
        onConfirm={() => handleInputChange('bankAccountConnected', true)}
      />
    </div>
  )
} 