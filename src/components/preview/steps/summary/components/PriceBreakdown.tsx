import { Clock, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReservationDetails } from "./ReservationDetails";

interface PriceBreakdownProps {
  theme: 'light' | 'dark';
  calculations: {
    courtPrice: number;
    itemsTotal: number;
    discount: number;
  };
  onShowItemsDetails: () => void;
  className?: string;
}

export function PriceBreakdown({ 
  theme,
  calculations,
  onShowItemsDetails,
  className
}: PriceBreakdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn(
        "w-full rounded-lg",
        "transition-all duration-200 ease-in-out",
        className
      )}
    >
      <div className="space-y-4">
        {/* Detalles de la Reserva */}
        <ReservationDetails theme={theme} />

        {/* Resumen de Precios */}
        <div className="space-y-3.5">
          {/* Precio Pista */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="h-[18px] w-[18px] text-gray-400" />
              <p className={cn(
                "text-[15px] font-medium",
                theme === 'dark' ? "text-gray-300" : "text-gray-600"
              )}>
                Pista
              </p>
            </div>
            <p className={cn(
              "text-[15px] font-medium",
              theme === 'dark' ? "text-gray-200" : "text-gray-700"
            )}>
              €{calculations.courtPrice}
            </p>
          </div>

          {/* Precio Artículos */}
          {calculations.itemsTotal > 0 && (
            <div className="flex items-center justify-between">
              <button
                onClick={onShowItemsDetails}
                className="flex items-center gap-2.5 group"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="h-[18px] w-[18px] text-gray-400"
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" />
                </svg>
                <p className={cn(
                  "text-[15px] font-medium",
                  theme === 'dark' ? "text-gray-300" : "text-gray-600"
                )}>
                  Artículos
                </p>
              </button>
              <p className={cn(
                "text-[15px] font-medium",
                theme === 'dark' ? "text-gray-200" : "text-gray-700"
              )}>
                €{calculations.itemsTotal}
              </p>
            </div>
          )}

          {/* Descuento si hay cupón aplicado */}
          {calculations.discount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Ticket className="h-[18px] w-[18px] text-gray-400" />
                <p className={cn(
                  "text-[15px] font-medium",
                  theme === 'dark' ? "text-gray-300" : "text-gray-600"
                )}>
                  Descuento
                </p>
              </div>
              <p className={cn(
                "text-[15px] font-medium text-green-500",
                theme === 'dark' ? "text-green-400" : "text-green-600"
              )}>
                -€{calculations.discount}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 