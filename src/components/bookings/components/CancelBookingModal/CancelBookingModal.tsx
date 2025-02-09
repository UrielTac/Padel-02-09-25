import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { IconAlertCircle } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CancelBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason?: string) => void
}

export function CancelBookingModal({
  isOpen,
  onClose,
  onConfirm
}: CancelBookingModalProps) {
  const [reason, setReason] = useState('')

  const handleConfirm = (reason?: string) => {
    onConfirm(reason)
  }

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[999] isolate">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-white rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconAlertCircle className="w-6 h-6 text-red-600" strokeWidth={2} />
                </div>
                <div className="flex-1 space-y-1.5">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    Confirmar Cancelación
                  </h3>
                  <p className="text-sm leading-5 text-gray-500">
                    ¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Motivo de la cancelación
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Escribe el motivo de la cancelación (opcional)"
                  className={cn(
                    "w-full px-3 py-2 rounded-lg",
                    "border border-gray-200 bg-white",
                    "focus:outline-none focus:border-gray-300",
                    "transition-colors duration-200",
                    "placeholder:text-gray-400",
                    "text-sm",
                    "h-24 resize-none"
                  )}
                />
              </div>

              {/* Footer */}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleConfirm(reason)}
                  variant="outline"
                  className="flex-1 border-gray-200 hover:border-red-100 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                >
                  Cancelar Reserva
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 border-gray-200 bg-white hover:bg-gray-50/80 transition-colors duration-200"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
} 