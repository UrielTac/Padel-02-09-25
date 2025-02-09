'use client';

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import { CardSetupForm } from "../components/CardSetupForm";
import { useStripe } from '@/contexts/StripeContext';
import { useStoredCards } from "@/hooks/useStoredCards";
import { SavedCard } from "../components/SavedCard";
import { toast } from "sonner";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CardCarousel } from "../components/CardCarousel";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  viewType: "mobile" | "desktop";
  onSelect: (methodId: string) => void;
  isPublicView?: boolean;
  empresaId: string;
}

export function PaymentMethodModal({
  isOpen,
  onClose,
  theme,
  viewType,
  onSelect: handleCardSelect,
  isPublicView = false,
  empresaId
}: PaymentMethodModalProps) {
  const [showCardForm, setShowCardForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>(undefined);
  let stripeContext;
  let isStripeAvailable = true;

  try {
    stripeContext = useStripe();
  } catch (error) {
    isStripeAvailable = false;
    console.log('Stripe no está disponible en el modal:', error);
  }

  const { stripeAccountId, isConnected, isLoading, error, charges_enabled } = stripeContext || {
    stripeAccountId: null,
    isConnected: false,
    isLoading: false,
    error: null,
    charges_enabled: false
  };

  const { cards, isLoading: isCardsLoading, error: cardsError, deleteCard } = useStoredCards(refreshTrigger);

  const handleAddCard = () => {
    if (!isStripeAvailable) {
      toast.error('El sistema de pagos no está disponible');
      return;
    }

    if (!isConnected) {
      toast.error('La cuenta de Stripe no está configurada correctamente');
      return;
    }
    setShowCardForm(true);
  };

  const handleBack = () => {
    setShowCardForm(false);
  };

  const handleCardSetupSuccess = async (paymentMethodId: string) => {
    try {
      setShowCardForm(false);
      handleCardSelect(paymentMethodId);
      
      // Incrementar el trigger para recargar las tarjetas
      setRefreshTrigger(prev => prev + 1);
      
      // Esperar un momento para que se actualice la lista
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Si después de la actualización hay tarjetas, cerrar el modal
      if (cards.length > 0) {
        onClose();
        toast.success('Tarjeta guardada exitosamente');
      }
    } catch (error) {
      console.error('Error al actualizar las tarjetas:', error);
      toast.error('Error al actualizar la lista de tarjetas');
    }
  };

  const handleCardSetupError = (error: any) => {
    toast.error(error.message || 'Error al configurar la tarjeta');
    console.error('Error al configurar la tarjeta:', error);
  };

  const handleCardDelete = async (cardId: string) => {
    try {
      await deleteCard(cardId);
      setRefreshTrigger(prev => prev + 1);
      toast.success('Tarjeta eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar la tarjeta:', error);
      toast.error('Error al eliminar la tarjeta');
      throw error;
    }
  };

  const handleCardSelection = (cardId: string) => {
    setSelectedCardId(cardId);
    handleCardSelect(cardId);
  };

  if (isLoading || isCardsLoading) {
    return <div className="p-4 text-center">Cargando configuración de pagos...</div>;
  }

  if (error || cardsError) {
    return (
      <div className="p-4 text-center text-red-600">
        Error: {(error || cardsError)?.message}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "bg-black z-[60]",
              isPublicView ? "fixed inset-0" : "absolute inset-0"
            )}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 200
            }}
            className={cn(
              viewType === "mobile"
                ? "fixed bottom-0 left-0 right-0 min-h-[500px] max-h-[70vh]"
                : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[600px]",
              theme === 'dark' ? "bg-neutral-900" : "bg-white",
              "shadow-xl z-[70] rounded-t-xl overflow-hidden"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
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
                        {showCardForm ? 'Agregar Nueva Tarjeta' : 'Métodos de Pago'}
                      </h3>
                      <p className={cn(
                        "text-sm",
                        theme === 'dark' ? "text-gray-400" : "text-gray-500"
                      )}>
                        {!isStripeAvailable ? 'Sistema de pagos no disponible' :
                         isLoading ? 'Verificando configuración...' :
                         !isConnected ? 'Configuración de pagos pendiente' :
                         !charges_enabled ? 'Pagos no habilitados' :
                         showCardForm ? 'Ingresa los datos de tu tarjeta' : 'Selecciona o agrega un método de pago'}
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className={cn(
                        "p-1.5 rounded-md transition-colors",
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
              <div className="flex-1 p-4 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {showCardForm ? (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      {isStripeAvailable && (
                        <CardSetupForm
                          onSuccess={handleCardSetupSuccess}
                          onError={handleCardSetupError}
                          onBack={handleBack}
                          theme={theme}
                        />
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {!showCardForm && cards.length > 0 ? (
                        <CardCarousel
                          cards={cards}
                          theme={theme}
                          selectedCardId={selectedCardId}
                          onSelect={(card) => handleCardSelection(card.id)}
                          onAddCard={handleAddCard}
                        />
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <button
                            onClick={handleAddCard}
                            disabled={!isStripeAvailable || !isConnected || !charges_enabled}
                            className={cn(
                              "w-full p-6 rounded-xl flex flex-col items-center justify-center gap-4",
                              "border-2 border-dashed",
                              theme === 'dark'
                                ? "border-neutral-700 hover:border-neutral-600 text-gray-400"
                                : "border-gray-200 hover:border-gray-300 text-gray-600",
                              "transition-colors",
                              (!isStripeAvailable || !isConnected || !charges_enabled) && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <Plus className="h-8 w-8" />
                            <span>Agregar Nueva Tarjeta</span>
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 