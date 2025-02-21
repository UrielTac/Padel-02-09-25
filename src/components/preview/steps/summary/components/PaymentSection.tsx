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
      className="space-y-3"
    >
      {/* Título de la sección */}
      <h3 className={cn(
        "text-base font-medium px-1",
        theme === 'dark' ? "text-white/90" : "text-gray-900"
      )}>
        Método de pago
      </h3>

      {!methodToDisplay || !isValidPaymentMethod() ? (
        <button
          onClick={handleShowMethods}
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
            <CreditCard className={cn(
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
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-1.5 rounded-md",
                theme === 'dark' ? "bg-neutral-800" : "bg-gray-50"
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
                  "text-xs mt-1",
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