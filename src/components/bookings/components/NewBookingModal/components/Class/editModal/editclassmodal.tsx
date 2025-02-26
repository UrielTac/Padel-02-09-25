"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import type { Database } from "@/types/supabase"
import { ClassEditBasic } from "./Classeditbasic"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData?: ClassData;
  onSuccess?: () => void;
}

interface ModalHeaderProps {
  title: string
  description: string
}

interface ModalFooterProps {
  onSave: () => void
  isValid: boolean
  isSubmitting?: boolean
}

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBookingType: 'class';
  disableTypeSelection: boolean;
  onSuccess?: () => void;
}

// Componente Header interno
function ModalHeader({ title, description }: ModalHeaderProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="p-6 border-b"
    >
      <motion.h2 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-xl font-semibold text-gray-900"
      >
        {title}
      </motion.h2>
      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-gray-500 mt-1"
      >
        {description}
      </motion.p>
    </motion.div>
  )
}

// Componente Footer interno
function ModalFooter({ onSave, isValid, isSubmitting = false }: ModalFooterProps) {
  return (
    <div className="p-6 border-t">
      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={!isValid || isSubmitting}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium",
            "bg-black text-white hover:bg-gray-800",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors duration-200"
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              Guardando...
            </span>
          ) : (
            'Guardar Cambios'
          )}
        </button>
      </div>
    </div>
  )
}

export function EditClassModal({ isOpen, onClose, classData, onSuccess }: EditClassModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [updatedData, setUpdatedData] = useState<Partial<Database['public']['Tables']['classes']['Row']>>({})
  const supabase = createClientComponentClient<Database>()

  // Manejar montaje/desmontaje
  useState(() => {
    setMounted(true)
    return () => setMounted(false)
  })

  const handleSave = async () => {
    if (!classData?.id) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('classes')
        .update({
          ...updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', classData.id)

      if (error) throw error

      toast.success('Clase actualizada exitosamente')
      onClose()
      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar la clase')
    } finally {
      setIsSubmitting(false)
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
            className="fixed inset-0 bg-white/30 backdrop-blur-[2px] z-40"
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
            className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl border-l z-50"
          >
            <div className="h-full flex flex-col">
              <ModalHeader 
                title="Editar Clase" 
                description="Modifica los detalles de la clase"
              />

              <div className="flex-1 overflow-y-auto p-6">
                <ClassEditBasic
                  classData={classData}
                  onValidationChange={setIsValid}
                  onChange={setUpdatedData}
                />
              </div>

              <ModalFooter
                onSave={handleSave}
                isValid={isValid}
                isSubmitting={isSubmitting}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
