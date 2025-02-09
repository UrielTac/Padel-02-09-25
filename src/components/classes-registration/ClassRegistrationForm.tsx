"use client"

import { useEffect } from 'react'
import { useClasses } from './hooks'
import { StepRenderer } from './steps/StepRenderer'
import { useClassRegistration } from './context'
import { LoadingSpinner } from './shared/LoadingSpinner'
import { ErrorMessage } from './shared/ErrorMessage'
import { StepContainer } from './shared/StepContainer'
import { StepNavigation } from './shared/StepNavigation'
import type { Step } from './types/registration'
import { useRouter } from 'next/navigation'
import { LinkService } from './services/linkService'

const linkService = new LinkService()

interface ClassRegistrationFormProps {
  selectedClassId?: string
}

export function ClassRegistrationForm({ selectedClassId }: ClassRegistrationFormProps) {
  const { state, isLoading, organization, goToStep, dispatch, selectClass } = useClassRegistration()
  const { classes = [], isLoading: isLoadingClasses } = useClasses(organization?.id || '')
  const router = useRouter()

  // Efecto para manejar el acceso directo a una clase
  useEffect(() => {
    if (selectedClassId && !state.selectedClass && classes.length > 0) {
      // Buscar la clase por ID
      const selectedClass = classes.find(c => c.id === selectedClassId)
      if (selectedClass) {
        // Seleccionar la clase y navegar al paso de sesión
        selectClass(selectedClass)
        goToStep('session')
      }
    }
  }, [selectedClassId, state.selectedClass, classes, selectClass, goToStep])

  // Estado de carga
  if (isLoading || isLoadingClasses) {
    return (
      <StepContainer stepId="loading" centered>
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-sm text-gray-500">
            Cargando información...
          </p>
        </div>
      </StepContainer>
    )
  }

  // Estado de error
  if (!organization) {
    return (
      <StepContainer stepId="error" centered>
        <ErrorMessage 
          error={{ 
            type: 'LOAD_ERROR', 
            message: 'No se pudo cargar la información de la organización. Por favor, intenta nuevamente.' 
          }} 
        />
      </StepContainer>
    )
  }

  // Configuración de navegación para cada paso
  const getStepConfig = (currentStep: Step) => {
    const config = {
      showBack: true,
      showNext: true,
      isNextDisabled: false,
      nextLabel: 'Continuar',
      onNext: undefined as (() => void) | undefined,
      onBack: undefined as (() => void) | undefined
    }

    switch (currentStep) {
      case 'auth':
        config.showBack = false
        config.nextLabel = 'Comenzar'
        config.onNext = () => goToStep('package')
        break
      case 'package':
        config.showBack = false
        config.nextLabel = state.selectedPackage ? 'Continuar' : 'Continuar sin paquete'
        config.onNext = () => {
          if (!state.selectedPackage) {
            dispatch({ type: 'SET_SKIP_PACKAGE', payload: true })
          }
          goToStep('class')
        }
        break
      case 'class':
        config.isNextDisabled = !state.selectedClass
        config.onNext = async () => {
          if (!state.selectedClass) {
            console.warn('No hay clase seleccionada')
            return
          }

          if (!organization.id) {
            console.error('No se encontró el ID de la organización')
            return
          }

          try {
            // Obtener el slug de la organización
            const companyLink = await linkService.getCompanyLink(organization.id)
            if (!companyLink?.slug) {
              console.error('No se encontró el slug de la organización')
              return
            }

            console.log('Navegando al siguiente paso:', {
              classId: state.selectedClass.id,
              slug: companyLink.slug
            })

            // Actualizamos la URL y navegamos al siguiente paso
            const newUrl = `/clases/${companyLink.slug}/${state.selectedClass.id}`
            router.push(newUrl)
            goToStep('session')
          } catch (error) {
            console.error('Error al navegar:', error)
          }
        }
        config.onBack = () => goToStep('package')
        break
      case 'session':
        config.isNextDisabled = state.selectedSessions.length === 0
        config.onNext = () => goToStep('summary')
        config.onBack = () => goToStep('class')
        break
      case 'summary':
        config.onNext = () => goToStep('payment')
        config.onBack = () => goToStep('session')
        break
      case 'payment':
        config.nextLabel = 'Confirmar pago'
        config.onNext = () => goToStep('confirmation')
        config.onBack = () => goToStep('summary')
        break
      case 'confirmation':
        config.showNext = false
        config.onBack = () => goToStep('payment')
        break
    }

    return config
  }

  const stepConfig = getStepConfig(state.step)

  return (
    <div className="relative min-h-screen">
      <StepRenderer />
      <StepNavigation
        onNext={stepConfig.onNext}
        onBack={stepConfig.onBack}
        nextLabel={stepConfig.nextLabel}
        showBack={stepConfig.showBack}
        showNext={stepConfig.showNext}
        isNextDisabled={stepConfig.isNextDisabled}
      />
    </div>
  )
} 