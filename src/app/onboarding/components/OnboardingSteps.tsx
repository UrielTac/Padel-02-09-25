'use client'

import { useState } from "react"
import { useOnboarding } from "@/app/onboarding/context/OnboardingContext"
import { CompanyStep } from "@/app/onboarding/components/steps/CompanyStep"
import { SucursalSelection } from "@/app/onboarding/components/steps/Branches/Sucursal-Selection"
import { BranchesStep } from "@/app/onboarding/components/steps/Branches/BranchesStep"
import { IntegrationsStep } from "@/app/onboarding/components/steps/IntegrationsStep"
import { Resume } from "@/app/onboarding/components/steps/Resume"
import { FinalStep } from "@/app/onboarding/components/steps/FinalStep"
import { motion, AnimatePresence } from "framer-motion"
import { Planes } from "@/app/onboarding/components/steps/Planes"

export function OnboardingSteps() {
  const { currentStep, completedSteps, setCurrentBranchId } = useOnboarding()
  const [branchSubStep, setBranchSubStep] = useState<'selection' | 'details'>('selection')

  const isOnboardingComplete = completedSteps.every(step => step === true)

  const handleConfigureBranch = () => {
    setBranchSubStep('details')
  }

  const handleReturnToSelection = () => {
    setBranchSubStep('selection')
    setCurrentBranchId(null)
  }

  const renderBranchesStep = () => {
    if (branchSubStep === 'selection') {
      return (
        <SucursalSelection 
          onNext={() => {}}
          onConfigureBranch={handleConfigureBranch}
        />
      )
    }
    return (
      <BranchesStep 
        onReturnToSelection={handleReturnToSelection}
      />
    )
  }

  const renderStep = () => {
    if (isOnboardingComplete || currentStep > 3) {
      return <FinalStep />
    }

    switch (currentStep) {
      case 0:
        return <CompanyStep />
      case 1:
        return renderBranchesStep()
      case 2:
        return <IntegrationsStep />
      case 3:
        return <Planes />
      default:
        return <FinalStep />
    }
  }

  return (
    <div className="max-w-3xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={isOnboardingComplete ? 'final' : currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-xl"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
} 