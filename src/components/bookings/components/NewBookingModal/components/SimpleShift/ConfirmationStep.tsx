import { motion } from "framer-motion"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { IconCheck } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { Court } from "@/lib/data"

interface ConfirmationStepProps {
  selectedDate: Date
  selectedCourts: string[]
  courts: Court[]
  totalAmount: number
  rentals: any[] // Ajusta el tipo según tu implementación
  sampleRentalItems: any[] // Ajusta el tipo según tu implementación
}

export function ConfirmationStep({
  selectedDate,
  selectedCourts,
  courts,
  totalAmount,
  rentals,
  sampleRentalItems
}: ConfirmationStepProps) {
  // Función para formatear la fecha de manera segura
  const formatDate = (date: Date | null | undefined) => {
    try {
      if (!date) return 'Fecha no disponible'
      // Verificar si la fecha es válida
      const parsedDate = new Date(date)
      if (isNaN(parsedDate.getTime())) return 'Fecha no disponible'
      
      return format(parsedDate, "d 'de' MMMM, yyyy", { locale: es })
    } catch (error) {
      console.error('Error al formatear la fecha:', error)
      return 'Fecha no disponible'
    }
  }

  return (
    <div className="space-y-8 px-8 py-2 flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center w-full"
      >
        {/* Círculo animado con check */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: 0.1
          }}
          className="relative w-20 h-20 mb-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.2
            }}
            className="absolute inset-0 bg-black rounded-full"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.3
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <IconCheck className="w-10 h-10 text-white" stroke={2} />
          </motion.div>
        </motion.div>

        {/* Texto de confirmación */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8"
        >
          <h3 className="text-xl font-medium text-gray-900">
            ¡Reserva Confirmada!
          </h3>
        </motion.div>

        {/* Detalles de la reserva */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-100">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fecha</span>
                <span className="font-medium text-gray-900">
                  {formatDate(selectedDate)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cancha</span>
                <span className="font-medium text-gray-900">
                  {selectedCourts.map(id => 
                    courts.find(court => court.id === id)?.name
                  ).join(', ')}
                </span>
              </div>
              {rentals.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Artículos</span>
                  <span className="font-medium text-gray-900">
                    {rentals.length} {rentals.length === 1 ? 'artículo' : 'artículos'}
                  </span>
                </div>
              )}
              <div className="pt-3 border-t flex justify-between text-sm">
                <span className="font-medium text-gray-900">Total</span>
                <span className="font-medium text-gray-900">
                  ${totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
} 