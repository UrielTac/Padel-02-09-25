import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { PaymentType, PAYMENT_TYPES } from "../types";

interface PaymentTypeSectionProps {
  theme: 'light' | 'dark';
  selectedType: PaymentType['id'] | null;
  onShowTypes: () => void;
  onRemoveType: () => void;
  onShowCardModal?: () => void;
}

export function PaymentTypeSection({
  theme,
  selectedType,
  onShowTypes,
  onRemoveType,
  onShowCardModal
}: PaymentTypeSectionProps) {
  const selectedTypeData = selectedType ? PAYMENT_TYPES.find(t => t.id === selectedType) : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="space-y-3"
    >
      {/* Título de la sección */}
      <h3 className={cn(
        "text-base font-medium px-1",
        theme === 'dark' ? "text-white/90" : "text-gray-900"
      )}>
        Elige tu tipo de pago
      </h3>

      {!selectedTypeData ? (
        <button
          onClick={onShowTypes}
          className={cn(
            "w-full h-[52px] rounded-lg flex items-center justify-center",
            "transition-all duration-200",
            "bg-white dark:bg-neutral-900",
            "border border-gray-100 dark:border-neutral-800",
            "hover:border-gray-200 dark:hover:border-neutral-700",
            "shadow-[0_1px_4px_-2px_rgba(0,0,0,0.05)]",
            "dark:shadow-[0_1px_4px_-2px_rgba(0,0,0,0.3)]"
          )}
        >
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center",
            "transition-colors duration-200",
            "bg-gray-50 dark:bg-neutral-800",
            "group-hover:bg-gray-100 dark:group-hover:bg-neutral-700"
          )}>
            <Plus className={cn(
              "h-3.5 w-3.5 transition-colors duration-200",
              "text-gray-400 dark:text-neutral-400"
            )} />
          </div>
        </button>
      ) : (
        <div className={cn(
          "p-3 rounded-lg",
          "transition-all duration-200",
          "bg-white dark:bg-neutral-900",
          "border border-gray-100 dark:border-neutral-800",
          "shadow-[0_1px_4px_-2px_rgba(0,0,0,0.05)]",
          "dark:shadow-[0_1px_4px_-2px_rgba(0,0,0,0.3)]"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className={cn(
                "text-sm font-medium",
                theme === 'dark' 
                  ? "text-gray-200"
                  : "text-gray-900"
              )}>
                {selectedTypeData.name}
              </span>
              <span className={cn(
                "text-xs mt-1",
                theme === 'dark' 
                  ? "text-gray-400"
                  : "text-gray-500"
              )}>
                {selectedTypeData.description}
              </span>
            </div>
            <button
              onClick={onRemoveType}
              className={cn(
                "p-1.5 rounded-lg transition-colors duration-200",
                theme === 'dark' 
                  ? "text-gray-400 hover:bg-neutral-800"
                  : "text-gray-400 hover:bg-gray-50"
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
} 