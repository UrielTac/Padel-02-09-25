import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { PaymentMethod } from "../types";
import { useStripe } from '@/contexts/StripeContext';
import { toast } from "sonner";

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
  let stripeContext;
  let isStripeAvailable = true;

  try {
    stripeContext = useStripe();
  } catch (error) {
    isStripeAvailable = false;
    console.log('Stripe no está disponible:', error);
  }

  const { stripeAccountId, isConnected, isLoading, error, charges_enabled } = stripeContext || {
    stripeAccountId: null,
    isConnected: false,
    isLoading: false,
    error: null,
    charges_enabled: false
  };

  const handleShowMethods = () => {
    if (!isStripeAvailable) {
      toast.error('El sistema de pagos no está disponible en este momento');
      return;
    }

    if (isLoading) {
      toast.info('Verificando configuración de pagos...');
      return;
    }

    if (error) {
      toast.error('Error al verificar la configuración de pagos');
      console.error('Error de Stripe:', error);
      return;
    }

    if (!isConnected) {
      toast.error('La cuenta de Stripe no está conectada');
      return;
    }

    if (!charges_enabled) {
      toast.error('Los pagos no están habilitados para esta cuenta');
      return;
    }

    onShowMethods();
  };

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
      {!selectedMethod ? (
        <button
          onClick={handleShowMethods}
          className={cn(
            "w-full p-3 rounded-lg flex items-center justify-between",
            "border-2 border-dashed transition-colors",
            theme === 'dark' 
              ? "border-neutral-700 hover:border-neutral-600 bg-neutral-900/50" 
              : "border-gray-200 hover:border-gray-300 bg-gray-50/50",
            (!isStripeAvailable || isLoading || !isConnected || !charges_enabled) && "opacity-50 cursor-not-allowed"
          )}
          disabled={!isStripeAvailable || isLoading || !isConnected || !charges_enabled}
        >
          <span className={cn(
            "text-xs",
            theme === 'dark' ? "text-neutral-300" : "text-gray-600"
          )}>
            {!isStripeAvailable ? 'Sistema de pagos no disponible' :
             isLoading ? 'Verificando configuración...' :
             !isConnected ? 'Configuración de pagos pendiente' :
             !charges_enabled ? 'Pagos no habilitados' :
             'Seleccionar medio de pago'}
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
              "text-xs font-medium",
              theme === 'dark' ? "text-gray-200" : "text-gray-900"
            )}>
              {selectedMethod.name}
            </span>
            <span className={cn(
              "text-xs",
              theme === 'dark' ? "text-gray-400" : "text-gray-500"
            )}>
              {selectedMethod.description}
            </span>
          </div>
          <button
            onClick={onRemoveMethod}
            className={cn(
              "p-1.5 rounded-md",
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