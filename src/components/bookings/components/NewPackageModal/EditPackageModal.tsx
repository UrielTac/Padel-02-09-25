"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "sonner"
import { createSupabaseClient } from '@/lib/supabase'
import { ModalFooter } from "../NewBookingModal/components/ModalFooter"
import { ModalHeader } from "./components/ModalHeader"
import { PackageDetails } from "./components/PackageDetails"
import { PackagePaymentMethods } from "./components/PackagePaymentMethods"
import { PackageConfirmationStep } from "./components/PackageConfirmationStep"
import type { EditPackageModalProps, EditPackageStep, PackageDetails as IPackageDetails, PackagePaymentConfig } from "./types"

const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID

const supabase = createSupabaseClient()

export function EditPackageModal({ isOpen, onClose, packageData, onSuccess }: EditPackageModalProps) {
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState<EditPackageStep>('edit-details')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [isUpdated, setIsUpdated] = useState(false)
  const [showHeader, setShowHeader] = useState(true)
  const [packageDetails, setPackageDetails] = useState<IPackageDetails>({
    name: packageData.name,
    classCount: packageData.class_count,
    price: packageData.price,
    expirationDays: packageData.expiration_days
  })
  const [packagePayment, setPackagePayment] = useState<PackagePaymentConfig>({
    paymentMethods: packageData.available_payment_methods as ('stripe' | 'transfer')[]
  })

  // Manejar montaje/desmontaje
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Reiniciar el estado cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('edit-details')
      setIsSubmitting(false)
      setIsUpdated(false)
      setShowHeader(true)
      setPackageDetails({
        name: packageData.name,
        classCount: packageData.class_count,
        price: packageData.price,
        expirationDays: packageData.expiration_days
      })
      setPackagePayment({
        paymentMethods: packageData.available_payment_methods as ('stripe' | 'transfer')[]
      })
    }
  }, [isOpen, packageData])

  const handleUpdatePackage = async () => {
    try {
      setIsSubmitting(true)
      const supabase = createSupabaseClient()

      // Obtener el ID de usuario predeterminado del entorno
      const defaultUserId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID

      if (!defaultUserId) {
        throw new Error('ID de usuario predeterminado no configurado')
      }

      // Obtener el empresa_id asociado al usuario predeterminado
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select('id')
        .eq('auth_user_id', defaultUserId)
        .single()

      if (empresaError || !empresaData) {
        throw new Error('No se encontró una empresa asociada al usuario predeterminado')
      }

      // Actualizar el paquete
      const { error: packageError } = await supabase
        .from('packages')
        .update({
          name: packageDetails.name,
          class_count: packageDetails.classCount,
          price: packageDetails.price,
          expiration_days: packageDetails.expirationDays,
          available_payment_methods: packagePayment.paymentMethods,
          updated_at: new Date().toISOString()
        })
        .eq('id', packageData.id)
        .eq('empresa_id', empresaData.id)

      if (packageError) {
        console.error('Error detallado al actualizar paquete:', packageError)
        throw new Error('Error al actualizar el paquete: ' + packageError.message)
      }

      setIsUpdated(true)
      toast.success('Paquete actualizado exitosamente')
      onSuccess?.()
    } catch (error) {
      console.error('Error al actualizar el paquete:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el paquete')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 'edit-details') {
      setCurrentStep('edit-payment')
    } else if (currentStep === 'edit-payment') {
      setCurrentStep('edit-confirmation')
    } else {
      handleUpdatePackage()
    }
  }

  const handleBack = () => {
    if (currentStep === 'edit-confirmation') {
      setCurrentStep('edit-payment')
    } else if (currentStep === 'edit-payment') {
      setCurrentStep('edit-details')
    } else {
      onClose()
    }
  }

  const getFooterText = () => {
    if (currentStep === 'edit-confirmation') {
      return 'Guardar Cambios'
    }
    return 'Continuar'
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'edit-details':
        return (
          <PackageDetails
            details={packageDetails}
            onChange={setPackageDetails}
            onValidationChange={setIsValid}
            mode="edit"
          />
        )
      case 'edit-payment':
        return (
          <PackagePaymentMethods
            config={packagePayment}
            onChange={setPackagePayment}
            onValidationChange={setIsValid}
            mode="edit"
          />
        )
      case 'edit-confirmation':
        return (
          <PackageConfirmationStep
            details={packageDetails}
            payment={packagePayment}
            isCreated={isUpdated}
            onSuccess={() => setShowHeader(false)}
            mode="edit"
          />
        )
    }
  }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
          />
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ 
              x: "100%", 
              opacity: 0,
              transition: {
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }
            }}
            transition={{ 
              type: "spring",
              damping: 30,
              stiffness: 300,
              mass: 0.8
            }}
            className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            {showHeader && (
              <ModalHeader 
                currentStep={currentStep}
                mode="edit"
              />
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {currentStep === 'edit-confirmation' ? (
                  <PackageConfirmationStep
                    details={packageDetails}
                    payment={packagePayment}
                    isCreated={isUpdated}
                    onSuccess={() => setShowHeader(false)}
                    mode="edit"
                  />
                ) : (
                  renderStep()
                )}
              </div>
            </div>

            {/* Footer */}
            {!isUpdated && (
              <ModalFooter 
                currentStep={currentStep}
                onBack={handleBack}
                onContinue={handleNext}
                isValid={isValid}
                isSubmitting={isSubmitting}
                continueText={getFooterText()}
                mode="edit"
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
} 