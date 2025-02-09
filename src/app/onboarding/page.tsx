'use client'

import { useState } from 'react'
import { OnboardingProvider } from './context/OnboardingContext'
import { OnboardingSteps } from './components/OnboardingSteps'
import { StepsList } from './components/StepsList'
import { FAQDialog } from './components/FAQ'
import { OnboardingDialog } from './components/Dialogs/OnboardingDialog'
import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OnboardingPage() {
  const [showFAQ, setShowFAQ] = useState(false)

  return (
    <OnboardingProvider>
      <div className="flex min-h-screen bg-gray-50">
        {/* Barra lateral */}
        <div className="fixed top-0 bottom-0 w-96 bg-gray-50 p-8 flex flex-col border-r border-gray-200">
          <div className="mb-12">
            <h2 className="text-gray-900 text-xl font-semibold mb-2">Configuración Inicial</h2>
            <p className="text-gray-500 text-sm">Complete los siguientes pasos para configurar su cuenta.</p>
          </div>
          
          {/* Lista de pasos en la barra lateral */}
          <nav className="flex-1">
            <StepsList />
          </nav>

          {/* Footer de la barra lateral */}
          <div className="mt-auto pt-6">
            <Button 
              variant="ghost" 
              className={cn(
                "text-sm text-gray-500",
                "hover:text-gray-900 hover:bg-gray-100",
                "transition-colors"
              )}
              onClick={() => setShowFAQ(true)}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Ayuda
            </Button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex items-center justify-center pl-96 py-8 bg-white">
          <div className="w-full max-w-4xl px-8">
            <OnboardingSteps />
          </div>
        </div>

        <FAQDialog 
          open={showFAQ} 
          onOpenChange={setShowFAQ} 
        />

        <OnboardingDialog />
      </div>
    </OnboardingProvider>
  )
} 