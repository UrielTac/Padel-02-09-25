import { Clock, Ticket, Package2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReservationDetails } from "./ReservationDetails";

interface PriceBreakdownProps {
  theme: 'light' | 'dark';
  calculations: {
    courtPrice: number;
    itemsTotal: number;
    discount: number;
    selectedItems: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      total: number;
    }>;
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

          {/* Desglose de Artículos */}
          {calculations.selectedItems.map((item) => (
            <div 
              key={item.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <Package2 className="h-[18px] w-[18px] text-gray-400" />
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-[15px] font-medium",
                    theme === 'dark' ? "text-gray-300" : "text-gray-600"
                  )}>
                    {item.name}
                  </p>
                  <span className={cn(
                    "text-[13px]",
                    theme === 'dark' ? "text-gray-400" : "text-gray-500"
                  )}>
                    ({item.quantity} x €{item.price})
                  </span>
                </div>
              </div>
              <p className={cn(
                "text-[15px] font-medium",
                theme === 'dark' ? "text-gray-200" : "text-gray-700"
              )}>
                €{item.total}
              </p>
            </div>
          ))}

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