"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PayPalSubscriptionButton } from "@/components/ui/paypal-subscription-button"
import { PayPalProvider } from "@/components/providers/paypal-provider"
import { subscriptionService } from "@/services/subscriptionService"
import { empresaService } from "@/services/empresaService"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { PAYPAL_CONFIG } from "@/config/paypal"

type BillingPeriod = "monthly" | "quarterly" | "annually"

interface BillingOption {
  id: BillingPeriod
  title: string
  price: number
  period: string
  description?: string
  savings?: string
}

interface PaymentFormProps {
  planName: string
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function PaymentForm({
  planName,
  onSubmit,
  onCancel
}: PaymentFormProps) {
  const [selectedBilling, setSelectedBilling] = useState<BillingPeriod>("quarterly")
  const [isProcessing, setIsProcessing] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const billingOptions: BillingOption[] = [
    {
      id: "monthly",
      title: "Pago mensual",
      price: PAYPAL_CONFIG.SUBSCRIPTION_PLANS.PRO_MONTHLY.price,
      period: "/mes",
      description: "Ideal para empezar"
    },
    {
      id: "quarterly",
      title: "Pago trimestral",
      price: PAYPAL_CONFIG.SUBSCRIPTION_PLANS.PRO_QUARTERLY.price,
      period: "/mes",
      savings: "Ahorra 10%",
      description: "Mayor flexibilidad"
    },
    {
      id: "annually",
      title: "Pago anual",
      price: PAYPAL_CONFIG.SUBSCRIPTION_PLANS.PRO_ANNUALLY.price / 12, // Convertir a precio mensual
      period: "/mes",
      savings: "Ahorra 35%",
      description: "Mejor valor"
    }
  ]

  const handlePayPalSuccess = async (data: any) => {
    try {
      setIsProcessing(true)

      if (!user?.metadata?.empresa_id) {
        throw new Error('No se encontró el ID de la empresa')
      }

      const empresaId = user.metadata.empresa_id

      // Calculamos la fecha de expiración basada en el período seleccionado
      const expiresAt = new Date()
      switch (selectedBilling) {
        case 'monthly':
          expiresAt.setMonth(expiresAt.getMonth() + 1)
          break
        case 'quarterly':
          expiresAt.setMonth(expiresAt.getMonth() + 3)
          break
        case 'annually':
          expiresAt.setFullYear(expiresAt.getFullYear() + 1)
          break
      }

      const paymentAmount = (() => {
        switch (selectedBilling) {
          case 'monthly':
            return PAYPAL_CONFIG.SUBSCRIPTION_PLANS.PRO_MONTHLY.price
          case 'quarterly':
            return PAYPAL_CONFIG.SUBSCRIPTION_PLANS.PRO_QUARTERLY.price
          case 'annually':
            return PAYPAL_CONFIG.SUBSCRIPTION_PLANS.PRO_ANNUALLY.price
          default:
            return PAYPAL_CONFIG.SUBSCRIPTION_PLANS.PRO_MONTHLY.price
        }
      })()

      // Usar el mismo servicio que en Planes.tsx
      const subscription = await subscriptionService.updatePayPalDetails({
        empresaId,
        subscriptionId: data.subscriptionID,
        subscriptionExpiresAt: expiresAt,
        paymentAmount,
        paypalData: {
          ...data,
          subscriptionID: data.subscriptionID,
          lastPaymentDate: new Date().toISOString(),
          nextPaymentDate: expiresAt.toISOString()
        }
      })

      if (subscription) {
        // Actualizar el plan de la empresa
        await empresaService.updatePlanType(empresaId, 'PRO' as const)
        
        toast({
          title: "Plan actualizado",
          description: "Tu suscripción se ha procesado correctamente.",
          duration: 5000,
        })

        onSubmit(data)
      }
    } catch (error: any) {
      console.error('❌ Error al procesar la suscripción:', error)
      toast({
        variant: "destructive",
        title: "Error al procesar la suscripción",
        description: error.message || "Hubo un problema al procesar tu suscripción.",
        duration: 5000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayPalError = (error: unknown) => {
    setIsProcessing(false)
    console.error('Error en el pago:', error)
    toast({
      variant: "destructive",
      title: "Error en el pago",
      description: "Hubo un problema al procesar el pago. Por favor, intenta de nuevo.",
      duration: 5000,
    })
  }

  return (
    <PayPalProvider>
      <div className="w-full max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900">
              Actualizar a {planName}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Con SimpleLink Pro podrás gestionar más reservas y clientes de una manera mucho más eficiente y moderna.
            </p>
          </div>

          {/* Billing Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-700">
              Opciones de facturación
            </h3>
            <div className="space-y-3">
              {billingOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedBilling(option.id)}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border transition-all duration-200",
                    "hover:bg-zinc-50",
                    selectedBilling === option.id
                      ? "border-zinc-800 bg-zinc-50/50"
                      : "border-zinc-200"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-normal text-zinc-800">
                          {option.title}
                        </span>
                        {option.savings && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50/50 text-emerald-700 text-[11px] font-normal">
                            {option.savings}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-medium text-zinc-900">
                          €{option.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-zinc-500 font-light">
                          {option.period}
                        </span>
                      </div>
                      {option.description && (
                        <p className="text-xs text-zinc-500">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* PayPal Button Section */}
          <div className="space-y-4">
            {isProcessing && (
              <div className="text-center text-sm text-zinc-500">
                Procesando tu pago...
              </div>
            )}
            <div className="rounded-xl border-2 border-zinc-100 p-4">
              <PayPalSubscriptionButton
                planType={selectedBilling}
                onSuccess={handlePayPalSuccess}
                onError={handlePayPalError}
              />
            </div>
          </div>

          {/* Cancel Button */}
          <div className="space-y-4 pt-4 border-t border-zinc-200">
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <p className="text-xs text-zinc-500 text-center">
              Al continuar, aceptas nuestros términos y condiciones.
            </p>
          </div>
        </motion.div>
      </div>
    </PayPalProvider>
  )
} 