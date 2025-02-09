"use client"

import { AnimatePresence } from 'framer-motion'
import { useClassRegistration } from '../context/ClassRegistrationContext'
import { PackageSelectionStep } from './PackageSelectionStep'
import { ClassSelectionStep } from './ClassSelectionStep'
import { SessionStep } from './SessionStep'
import { SummaryStep } from './SummaryStep'
import { PaymentStep } from './PaymentStep'
import { ConfirmationStep } from './ConfirmationStep'
import { UserBadge } from '../shared/UserBadge'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { cn } from '@/lib/utils'

export function StepRenderer() {
  const { state, organization, isLoading } = useClassRegistration()

  // Si estamos cargando o no hay organización, mostramos el spinner
  if (isLoading || !organization) {
    return (
      <div className={cn(
        "w-full h-full",
        "flex flex-col items-center justify-center",
        "relative"
      )}>
        <LoadingSpinner />
        <p className="text-sm text-gray-500 mt-4">
          Cargando información...
        </p>
      </div>
    )
  }

  return (
    <div className={cn(
      "w-full h-full",
      "flex flex-col",
      "relative"
    )}>
      {/* Header con el badge de usuario */}
      <div className={cn(
        "w-full",
        "flex items-center justify-end",
        "mb-8",
        "sticky top-0 z-10",
        "pt-4 sm:pt-6",
        "bg-white/95 backdrop-blur-sm"
      )}>
        <UserBadge />
      </div>

      {/* Contenedor principal de los pasos */}
      <div className={cn(
        "w-full flex-1",
        "flex flex-col",
        "min-h-0" // Importante para el scroll
      )}>
        {/* Contenedor del contenido del paso */}
        <AnimatePresence mode="wait">
          {state.step === 'package' && <PackageSelectionStep organization={organization} />}
          {state.step === 'class' && <ClassSelectionStep />}
          {state.step === 'session' && <SessionStep />}
          {state.step === 'summary' && <SummaryStep />}
          {state.step === 'payment' && <PaymentStep />}
          {state.step === 'confirmation' && <ConfirmationStep />}
        </AnimatePresence>
      </div>
    </div>
  )
} 