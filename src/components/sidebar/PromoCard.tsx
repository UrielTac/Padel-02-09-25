"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { BookingLimitStatus } from "@/components/booking/BookingLimitStatus"
import { useBookingCount } from '@/hooks/useBookingCount'
import { Zap } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useDeferredValue, useEffect, useState } from "react"

interface PromoCardProps {
  className?: string
}

export function PromoCard({ className }: PromoCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const today = new Date().toISOString().split('T')[0]
  const [shouldRender, setShouldRender] = useState(false)
  
  const { 
    isPro, 
    isLoading, 
    error 
  } = useBookingCount({ 
    empresaId: user?.metadata?.empresa_id || '', 
    date: today 
  })

  // Usar useDeferredValue para suavizar la transición
  const deferredIsPro = useDeferredValue(isPro)

  // Efecto para controlar cuándo mostrar el componente
  useEffect(() => {
    if (!isLoading && !error) {
      // Solo actualizar shouldRender si no es PRO
      setShouldRender(!deferredIsPro)
    }
  }, [isLoading, error, deferredIsPro])

  // No mostrar nada durante la carga inicial o si hay error
  if (isLoading || error || !user?.metadata?.empresa_id) return null

  // No renderizar si no debemos mostrar el componente
  if (!shouldRender) return null

  const handleUpgradeClick = () => {
    router.push('/admin/dashboard/upgrade')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className={cn("px-3 mb-4", className)}
    >
      <motion.div 
        onClick={handleUpgradeClick}
        className={cn(
          "p-3.5 rounded-xl",
          "bg-gray-900/95",
          "border border-gray-800",
          "cursor-pointer hover:bg-gray-900/90",
          "transition-all duration-200",
          "group"
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start">
            <div className="p-1.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
              <Zap className="h-3.5 w-3.5 text-primary text-white" />
            </div>
            <div className="flex-1 ml-2.5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-gray-100">Upgrade</h4>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Obtenga acceso Pro | Simple Link
              </p>
            </div>
          </div>
          <BookingLimitStatus 
            empresaId={user.metadata.empresa_id} 
            date={today}
            className="pt-2 border-t border-gray-800"
          />
        </div>
      </motion.div>
    </motion.div>
  )
} 