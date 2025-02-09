'use client'

import * as React from "react"
import { Check, Sparkles, X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { motion } from "framer-motion"
import { SelectOption } from "@/components/ui/selectoption"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useOnboarding } from "../../context/OnboardingContext"

interface PlanFeature {
  name: string
  included: boolean
}

interface Plan {
  name: string
  prices: {
    monthly: number
    quarterly: number
  }
  description: string
  extraInfo?: {
    title: string
    subtitle: string
    tooltip: string
  }
  features: PlanFeature[]
  isPopular?: boolean
  upcomingFeatures?: string[]
}

const plans: Plan[] = [
  {
    name: "Free",
    prices: {
      monthly: 0,
      quarterly: 0
    },
    description: "Perfecto para empezar a gestionar tu club",
    extraInfo: {
      title: "Plan Básico",
      subtitle: "Prueba gratuita sin límite de tiempo",
      tooltip: "Sin necesidad de tarjeta de crédito"
    },
    features: [
      { name: "1 sede", included: true },
      { name: "Hasta 5 pistas", included: true },
      { name: "20 reservas diarias", included: true },
      { name: "Panel de administración", included: true },
      { name: "Hasta 100 usuarios registrados", included: true },
      { name: "Soporte por email", included: true },
      { name: "Link de reserva", included: true },
      { name: "Personalización", included: false },
    ],
  },
  {
    name: "Pro",
    prices: {
      monthly: 24.70,
      quarterly: 69.69
    },
    description: "Todo lo que necesitas para escalar tu negocio",
    isPopular: true,
    features: [
      { name: "Pistas ilimitadas", included: true },
      { name: "Reservas ilimitadas", included: true },
      { name: "Panel de administración", included: true },
      { name: "Usuarios ilimitados", included: true },
      { name: "Soporte por email y teléfono", included: true },
      { name: "Link de reserva personalizado", included: true },
    ],
    upcomingFeatures: [
      "Nuevos estilos del formulario de reserva",
      "Vista de estadísticas avanzadas",
      "Módulo de torneos"
    ]
  },
]

export function Planes() {
  const { completeAndAdvance } = useOnboarding()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'quarterly'>('quarterly')

  const handleSelectPlan = () => {
    completeAndAdvance(3)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      <div className="space-y-6 max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="text-center px-6 pb-4">
          <h2 className="text-2xl font-semibold tracking-tight mb-1.5">
            Elige tu plan
          </h2>
          <p className="text-sm text-muted-foreground/80 max-w-md mx-auto mb-4">
            Selecciona el plan que mejor se adapte a tus necesidades. ¡Comienza gratis!
          </p>
          
          <div className="flex justify-center mb-4">
            <SelectOption 
              value={billingPeriod}
              onValueChange={setBillingPeriod}
            />
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-[1200px] mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={cn(
                "relative bg-background p-6",
                plan.isPopular && "shadow-lg ring-1 ring-border/50",
                plan.prices.monthly === 0 && "border border-border"
              )}
            >
              {plan.isPopular && billingPeriod === 'quarterly' && (
                <div className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                  <Sparkles className="mr-1 h-3 w-3" />
                  10% de descuento
                </div>
              )}

              {/* Plan Content */}
              <div className="space-y-4">
                <div className="min-h-[120px]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{plan.name}</h3>
                    {plan.extraInfo && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>{plan.extraInfo.tooltip}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  <div className="mt-2 flex items-baseline">
                    {plan.prices[billingPeriod] === 0 ? (
                      <span className="text-2xl font-bold">Gratis</span>
                    ) : (
                      <>
                        {billingPeriod === 'quarterly' && plan.prices.monthly > 0 && (
                          <span className="text-lg line-through text-muted-foreground/70 mr-2">
                            {(plan.prices.monthly * 3).toFixed(2)}€
                          </span>
                        )}
                        <span className="text-3xl font-bold">{plan.prices[billingPeriod]}€</span>
                        <span className="ml-1 text-sm text-muted-foreground">
                          /{billingPeriod === 'monthly' ? 'mes' : 'trimestre'}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <Button 
                  className="w-full"
                  variant={plan.isPopular ? "default" : "outline"}
                  onClick={handleSelectPlan}
                >
                  {plan.prices.monthly === 0 ? "Comenzar gratis" : "Seleccionar plan"}
                </Button>

                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/50" />
                      )}
                      <span className={cn(
                        !feature.included && "text-muted-foreground"
                      )}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </div>

                {plan.upcomingFeatures && (
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-xs font-medium mb-2">
                      Próximas actualizaciones:
                    </p>
                    <ul className="space-y-1.5">
                      {plan.upcomingFeatures.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-gray-500"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Todos los precios incluyen IVA. Puedes cancelar o cambiar tu plan en cualquier momento.
          {" "}
          <span className="font-medium">
            El plan gratuito no requiere tarjeta de crédito.
          </span>
        </p>
      </div>
    </motion.div>
  )
}