'use client'

import React, { createContext, useContext, useState } from 'react'

interface OnboardingContextType {
  currentStep: number
  setCurrentStep: (step: number) => void
  steps: string[]
  completedSteps: boolean[]
  completeStep: (step: number) => void
  canAccessStep: (step: number) => boolean
  completeAndAdvance: (step: number) => void
  formData: any
  updateFormData: (data: any) => void
  branches: Branch[]
  setBranches: (branches: Branch[]) => void
  currentBranchId: string | null
  setCurrentBranchId: (id: string | null) => void
  updateBranchData: (branchId: string, data: any) => void
}

interface Branch {
  id: string
  name: string
  courts: number
  schedule: {
    open: string
    close: string
  }
  data?: any // Para almacenar los datos del formulario de BranchesStep
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false])
  const [formData, setFormData] = useState({})
  const [branches, setBranches] = useState<Branch[]>([{
    id: crypto.randomUUID(),
    name: 'Sede Principal',
    courts: 4,
    schedule: {
      open: '07:00',
      close: '22:00'
    }
  }])
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null)
  
  const steps = ['Empresa', 'Sucursales', 'Integraciones', 'Planes']

  const completeStep = (step: number) => {
    setCompletedSteps(prev => {
      const newCompleted = [...prev]
      newCompleted[step] = true
      return newCompleted
    })
  }

  const canAccessStep = (step: number) => {
    if (step === 0) return true
    return completedSteps[step - 1]
  }

  const completeAndAdvance = (step: number) => {
    completeStep(step)
    setCurrentStep(step + 1)
  }

  const updateFormData = (newData: any) => {
    setFormData(prev => ({ ...prev, ...newData }))
  }

  const updateBranchData = (branchId: string, data: any) => {
    setBranches(prev => prev.map(branch => 
      branch.id === branchId 
        ? { ...branch, data: { ...branch.data, ...data } }
        : branch
    ))
  }

  return (
    <OnboardingContext.Provider 
      value={{ 
        currentStep, 
        setCurrentStep,
        steps,
        completedSteps,
        completeStep,
        canAccessStep,
        completeAndAdvance,
        formData,
        updateFormData,
        branches,
        setBranches,
        currentBranchId,
        setCurrentBranchId,
        updateBranchData
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
} 