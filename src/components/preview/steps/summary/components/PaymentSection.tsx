import { X, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { PaymentMethod } from "../types";
import { useStripe } from '@/contexts/StripeContext';
import { toast } from "sonner";
import { CardBrandIcon } from "./CardBrandIcon";
import { useCallback, useState, useEffect } from "react";
import type { StripeContextType } from '@/contexts/StripeContext';

interface PaymentSectionProps {
  theme: 'light' | 'dark';
  selectedMethod: PaymentMethod | null;
  onShowMethods: () => void;
  onRemoveMethod: () => void;
  viewType?: "mobile" | "desktop";
  empresaId: string;
}

export function PaymentSection({
  theme,
  selectedMethod,
  onShowMethods,
  onRemoveMethod,
  viewType = "desktop",
  empresaId
}: PaymentSectionProps) {
  const [localMethod, setLocalMethod] = useState<PaymentMethod | null>(null);
  let stripeContext: StripeContextType | null = null;
  let isStripeAvailable = true;

  // Sincronizar el método seleccionado con el estado local
  useEffect(() => {
    if (selectedMethod && selectedMethod.id) {
      console.log('Actualizando método de pago local:', selectedMethod);
      setLocalMethod(selectedMethod);
    } else {
      setLocalMethod(null);
    }
  }, [selectedMethod]);

  try {
    stripeContext = useStripe();
  } catch (error) {
    isStripeAvailable = false;
    console.log('Stripe no está disponible:', error);
  }

  // Verificación detallada del método de pago
  const isValidPaymentMethod = useCallback(() => {
    const methodToValidate = localMethod || selectedMethod;
    console.log('Iniciando validación de método de pago:', methodToValidate);

    if (!methodToValidate) {
      console.log('No hay método seleccionado');
      return false;
    }

    try {
      // Validar campos requeridos individualmente para mejor debugging
      const validations = {
        id: Boolean(methodToValidate.id),
        brand: Boolean(methodToValidate.brand),
        last4: Boolean(methodToValidate.last4),
        expMonth: typeof methodToValidate.expMonth === 'number',
        expYear: typeof methodToValidate.expYear === 'number',
        type: methodToValidate.type === 'card'
      };

      console.log('Resultados de validación:', validations);

      const isValid = Object.values(validations).every(v => v === true);

      console.log('Método de pago válido:', isValid);
      return isValid;
    } catch (error) {
      console.error('Error en la validación:', error);
      return false;
    }
  }, [localMethod, selectedMethod]);

  const handleShowMethods = () => {
    if (!isStripeAvailable) {
      toast.error('El sistema de pagos no está disponible');
      return;
    }

    if (!stripeContext?.isConnected) {
      toast.error('La cuenta de Stripe no está configurada correctamente');
      return;
    }

    onShowMethods();
  };

  const handleRemoveMethod = () => {
    setLocalMethod(null);
    onRemoveMethod();
  };

  const methodToDisplay = localMethod || selectedMethod;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className={cn(
        "rounded-lg p-5",
        "transition-all duration-200 ease-in-out",
        theme === 'dark' 
          ? "bg-neutral-900"
          : "bg-gray-50 hover:bg-gray-100/80"
      )}
    >
      {!methodToDisplay || !isValidPaymentMethod() ? (
        <button
          onClick={handleShowMethods}
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
            {isStripeAvailable
              ? 'Seleccionar método de pago'
              : 'Sistema de pagos no disponible'}
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
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-1.5 rounded-md",
              theme === 'dark' ? "bg-neutral-800" : "bg-gray-100"
            )}>
              <CardBrandIcon brand={methodToDisplay.brand} className={cn(
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )} />
            </div>
            <div className="flex flex-col">
              <span className={cn(
                "text-sm font-medium",
                theme === 'dark' 
                  ? "text-gray-200"
                  : "text-gray-900"
              )}>
                {methodToDisplay.name || `${methodToDisplay.brand} terminada en ${methodToDisplay.last4}`}
              </span>
              <span className={cn(
                "text-xs mt-0.5",
                theme === 'dark' 
                  ? "text-gray-400"
                  : "text-gray-500"
              )}>
                {methodToDisplay.description || `Expira: ${methodToDisplay.expMonth.toString().padStart(2, '0')}/${methodToDisplay.expYear}`}
              </span>
            </div>
          </div>
          <button
            onClick={handleRemoveMethod}
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