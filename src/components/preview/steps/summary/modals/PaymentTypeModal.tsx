'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentType, PAYMENT_TYPES } from "../types";
import { useStripeConnection } from "@/hooks/useStripeConnection";
import { toast } from "sonner";

interface PaymentTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  viewType: "mobile" | "desktop";
  onSelect: (type: PaymentType['id']) => void;
  onShowCardModal: () => void;
  isPublicView?: boolean;
}

export function PaymentTypeModal({
  isOpen,
  onClose,
  theme,
  viewType,
  onSelect,
  onShowCardModal,
  isPublicView = false
}: PaymentTypeModalProps) {
  const [selectedType, setSelectedType] = useState<PaymentType | null>(null);
  const { isConnected, isLoading, error } = useStripeConnection();
  const [verifyingToast, setVerifyingToast] = useState<string | null>(null);

  // Limpiar toast al cerrar el modal
  useEffect(() => {
    if (!isOpen && verifyingToast) {
      toast.dismiss(verifyingToast);
      setVerifyingToast(null);
    }
  }, [isOpen, verifyingToast]);

  // Actualizar estado cuando cambia la conexión
  useEffect(() => {
    if (verifyingToast) {
      if (!isLoading) {
        toast.dismiss(verifyingToast);
        setVerifyingToast(null);

        if (error) {
          toast.error('Error al verificar la conexión con Stripe');
        } else if (!isConnected) {
          toast.error('El club debe configurar Stripe para aceptar garantías');
        } else if (selectedType?.id === 'guarantee') {
          // Proceder con la selección
          onClose();
          onSelect('guarantee');
          if (onShowCardModal) {
            onShowCardModal();
          } else {
            toast.error('Error: No se puede mostrar el formulario de tarjeta');
          }
        }
      }
    }
  }, [isLoading, error, isConnected, verifyingToast, selectedType, onClose, onSelect, onShowCardModal]);

  const handleTypeSelect = async (type: PaymentType) => {
    setSelectedType(type);

    if (type.id === 'guarantee') {
      if (isLoading) {
        const id = toast.loading('Verificando conexión con Stripe...');
        setVerifyingToast(id);
        return;
      }

      if (error) {
        toast.error('Error al verificar la conexión con Stripe');
        return;
      }

      if (!isConnected) {
        toast.error('El club debe configurar Stripe para aceptar garantías');
        return;
      }

      // Si todo está bien, proceder
      onClose();
      onSelect(type.id);
      if (onShowCardModal) {
        onShowCardModal();
      } else {
        toast.error('Error: No se puede mostrar el formulario de tarjeta');
      }
    } else {
      onSelect(type.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 z-50",
            "flex items-center justify-center",
            "bg-black/50"
          )}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              viewType === "mobile"
                ? "fixed bottom-0 left-0 right-0"
                : "w-[480px] rounded-xl",
              theme === 'dark' ? "bg-neutral-900" : "bg-white",
              "shadow-xl overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="border-b border-gray-100 dark:border-neutral-800">
              <div className="p-4 pb-3">
                {viewType === "mobile" && (
                  <div className="flex justify-center -mt-2 mb-3">
                    <div className={cn(
                      "w-10 h-1 rounded-full",
                      theme === 'dark' ? "bg-neutral-800" : "bg-gray-200"
                    )} />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={cn(
                      viewType === "mobile" ? "text-base" : "text-lg",
                      "font-medium mb-1",
                      theme === 'dark' ? "text-white" : "text-gray-900"
                    )}>
                      Tipo de Pago
                    </h3>
                    <p className={cn(
                      "text-sm",
                      theme === 'dark' ? "text-gray-400" : "text-gray-500"
                    )}>
                      Selecciona cómo deseas realizar el pago
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className={cn(
                      "p-1.5 rounded-md transition-colors self-start -mt-1",
                      theme === 'dark' 
                        ? "text-gray-400 hover:bg-neutral-800"
                        : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="space-y-2">
                {PAYMENT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type)}
                    disabled={type.id === 'guarantee' && isLoading}
                    className={cn(
                      "w-full p-4 rounded-lg text-left transition-colors",
                      selectedType?.id === type.id
                        ? theme === 'dark'
                          ? "bg-neutral-800 text-white"
                          : "bg-gray-100 text-gray-900"
                        : theme === 'dark'
                        ? "hover:bg-neutral-800 text-gray-300"
                        : "hover:bg-gray-100 text-gray-600",
                      type.id === 'guarantee' && isLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div>
                      <h4 className="font-medium mb-1">{type.name}</h4>
                      <p className={cn(
                        "text-sm",
                        theme === 'dark' ? "text-gray-400" : "text-gray-500"
                      )}>
                        {type.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 