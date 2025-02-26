import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { PaymentType, PaymentTypeEnum } from "../types";

interface PaymentTypeItemProps {
  type: PaymentType;
  isSelected: boolean;
  onClick: () => void;
  theme: 'light' | 'dark';
}

function PaymentTypeItem({ type, isSelected, onClick, theme }: PaymentTypeItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg cursor-pointer",
        "flex items-center justify-between mb-1",
        "transition-all duration-200 ease-in-out",
        // Solo aplicamos fondo si está seleccionado, sin bordes ni otras delimitaciones
        theme === 'dark'
          ? isSelected 
            ? "bg-neutral-700" 
            : "hover:bg-neutral-800/20"
          : isSelected 
            ? "bg-gray-100" 
            : "hover:bg-gray-50/70"
      )}
    >
      <div className="space-y-1">
        <p className={cn(
          "text-sm font-medium",
          theme === 'dark' ? "text-white" : "text-gray-900",
          "transition-colors duration-200"
        )}>
          {type.name}
        </p>
        <p className={cn(
          "text-xs",
          theme === 'dark' ? "text-gray-400" : "text-gray-500",
          "transition-colors duration-200"
        )}>
          {type.description}
        </p>
      </div>
      {isSelected && (
        <Check className={cn(
          "h-5 w-5",
          theme === 'dark' ? "text-gray-300" : "text-gray-600",
          "animate-appearance-in"
        )} />
      )}
    </div>
  );
}

interface PaymentTypeListProps {
  theme: 'light' | 'dark';
  selectedType: PaymentTypeEnum | null;
  onSelect: (type: PaymentTypeEnum) => void;
  paymentTypes: PaymentType[];
}

export function PaymentTypeList({
  theme,
  selectedType,
  onSelect,
  paymentTypes
}: PaymentTypeListProps) {
  return (
    <div className="space-y-0.5 py-2 px-2">
      {paymentTypes.map((type) => (
        <PaymentTypeItem
          key={type.id}
          type={type}
          isSelected={selectedType === type.id}
          onClick={() => onSelect(type.id as PaymentTypeEnum)}
          theme={theme}
        />
      ))}
    </div>
  );
} 