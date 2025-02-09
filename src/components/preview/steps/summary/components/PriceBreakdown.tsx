import { Clock, Package, Ticket } from "lucide-react";
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
}

export function PriceBreakdown({ 
  theme,
  calculations,
  onShowItemsDetails
}: PriceBreakdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn(
        "rounded-lg p-5",
        "transition-all duration-200 ease-in-out",
        theme === 'dark' 
          ? "bg-neutral-900"
          : "bg-gray-50 hover:bg-gray-100/80"
      )}
    >
      <div className="space-y-2">
        {/* Detalles de la Reserva */}
        <ReservationDetails theme={theme} />

        {/* Separador */}
        <div className={cn(
          "border-t my-5",
          theme === 'dark' ? "border-zinc-800" : "border-gray-200/50"
        )} />

        {/* Resumen de Precios */}
        <div className="space-y-3">
          {/* Precio Pista */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              <p className={cn(
                "text-sm font-medium",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Pista
              </p>
            </div>
            <p className={cn(
              "text-sm font-medium",
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
                className="flex items-center gap-1.5 group"
              >
                <Package className="h-3.5 w-3.5 text-gray-400" />
                <p className={cn(
                  "text-sm font-medium",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Artículos
                </p>
              </button>
              <p className={cn(
                "text-sm font-medium",
                theme === 'dark' ? "text-gray-200" : "text-gray-700"
              )}>
                €{calculations.itemsTotal}
              </p>
            </div>
          )}

          {/* Descuento si hay cupón aplicado */}
          {calculations.discount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5 text-gray-400" />
                <p className={cn(
                  "text-sm font-medium",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  Descuento
                </p>
              </div>
              <p className={cn(
                "text-sm font-medium text-green-500",
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