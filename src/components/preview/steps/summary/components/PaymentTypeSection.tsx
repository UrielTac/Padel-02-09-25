import { X } from "lucide-react";
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
      className={cn(
        "rounded-lg p-5",
        "transition-all duration-200 ease-in-out",
        theme === 'dark' 
          ? "bg-neutral-900"
          : "bg-gray-50 hover:bg-gray-100/80"
      )}
    >
      {!selectedTypeData ? (
        <button
          onClick={onShowTypes}
          className={cn(
            "w-full p-3 rounded-lg flex items-center justify-between",
            "border-2 border-dashed",
            theme === 'dark' 
              ? "border-neutral-700 hover:border-neutral-600 bg-neutral-900/50" 
              : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
          )}
        >
          <span className={cn(
            "text-xs",
            theme === 'dark' ? "text-neutral-300" : "text-gray-600"
          )}>
            Seleccionar tipo de pago
          </span>
        </button>
      ) : (
        <div className={cn(
          "p-3 rounded-lg flex items-center justify-between",
          "border-2 border-dashed",
          theme === 'dark' 
            ? "border-zinc-800 bg-zinc-900/50"
            : "border-gray-200 bg-gray-50"
        )}>
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
              "text-xs mt-0.5",
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
              "p-1 rounded-md self-start -mt-0.5",
              theme === 'dark' 
                ? "text-gray-400 hover:bg-zinc-800"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
} 