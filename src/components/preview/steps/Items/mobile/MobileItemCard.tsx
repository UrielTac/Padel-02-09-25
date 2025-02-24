import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";
import { ItemWithStock } from "../types";

interface MobileItemCardProps {
  item: ItemWithStock;
  theme: 'light' | 'dark';
  quantity: number;
  onQuantityChange: (value: number) => void;
  price: number;
}

export function MobileItemCard({
  item,
  theme,
  quantity,
  onQuantityChange,
  price
}: MobileItemCardProps) {
  return (
    <motion.div
      className={cn(
        "w-full h-full flex flex-col justify-between p-6",
        "transition-colors duration-200",
        theme === 'dark' ? "bg-neutral-900" : "bg-white"
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Información del ítem */}
      <div className="space-y-2">
        <h3 className={cn(
          "text-xl font-semibold",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          {item.name}
        </h3>
        <p className={cn(
          "text-sm",
          theme === 'dark' ? "text-gray-400" : "text-gray-500"
        )}>
          Stock disponible: {item.availableStock}
        </p>
        <p className={cn(
          "text-lg font-medium",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          ${price}
        </p>
      </div>

      {/* Selector de cantidad */}
      <div className="flex flex-col items-center mt-8">
        <button
          onClick={() => onQuantityChange(quantity + 1)}
          disabled={quantity >= item.availableStock}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            "transition-colors duration-200",
            theme === 'dark' 
              ? "hover:bg-neutral-800 text-white" 
              : "hover:bg-gray-100 text-gray-900",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <ChevronUp className="w-6 h-6" />
        </button>

        <span className={cn(
          "text-2xl font-semibold my-4",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          {quantity}
        </span>

        <button
          onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
          disabled={quantity <= 0}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            "transition-colors duration-200",
            theme === 'dark' 
              ? "hover:bg-neutral-800 text-white" 
              : "hover:bg-gray-100 text-gray-900",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
} 