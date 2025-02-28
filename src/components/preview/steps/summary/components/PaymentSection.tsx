import { X, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { PaymentMethod } from "../types";
import { useStripe } from '@/contexts/StripeContext';
import { toast } from "sonner";
import { CardBrandIcon } from "./CardBrandIcon";
import { useCallback, useState, useEffect } from "react";
import type { StripeContextType } from '@/contexts/StripeContext';
import { useStoredCards } from "@/hooks/useStoredCards";
import { CardList } from "./CardList";
import { CardSetupForm } from "./CardSetupForm";

interface PaymentSectionProps {
  theme: 'light' | 'dark';
  selectedMethod: PaymentMethod | null;
  onShowMethods: () => void;
  onUpdateMethod?: (method: PaymentMethod) => void;
  onRemoveMethod: () => void;
  viewType?: "mobile" | "desktop";
  empresaId: string;
  showModalOnSelect?: boolean;
}

export function PaymentSection({
  theme,
  selectedMethod,
  onShowMethods,
  onUpdateMethod,
  onRemoveMethod,
  viewType = "desktop",
  empresaId,
  showModalOnSelect = false
}: PaymentSectionProps) {
  const [localMethod, setLocalMethod] = useState<PaymentMethod | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  let stripeContext: StripeContextType | null = null;
  let isStripeAvailable = true;

  try {
    stripeContext = useStripe();
  } catch (error) {
    isStripeAvailable = false;
    console.log('Stripe no está disponible:', error);
  }

  const { cards, isLoading: isCardsLoading, error: cardsError, deleteCard } = useStoredCards(refreshTrigger);

  // Sincronizar el método seleccionado con el estado local
  useEffect(() => {
    if (selectedMethod && selectedMethod.id) {
      console.log('Actualizando método de pago local:', selectedMethod);
      setLocalMethod(selectedMethod);
      setIsListExpanded(false);
    } else {
      setLocalMethod(null);
    }
  }, [selectedMethod]);

  const handleCardSelect = useCallback((card: any) => {
    try {
      console.log('Seleccionando tarjeta:', card);

      // Crear el objeto PaymentMethod
      const paymentMethod: PaymentMethod = {
        id: card.id,
        brand: card.brand,
        last4: card.last4,
        expMonth: card.expMonth,
        expYear: card.expYear,
        type: 'card',
        name: `${card.brand} terminada en ${card.last4}`,
        description: `Expira: ${card.expMonth.toString().padStart(2, '0')}/${card.expYear}`
      };

      // Actualizar estado local
      setLocalMethod(paymentMethod);
      setIsListExpanded(false);

      // Actualizar estado global a través de onUpdateMethod
      if (onUpdateMethod) {
        onUpdateMethod(paymentMethod);
      }

      // Solo mostrar el modal si explícitamente se solicita
      if (showModalOnSelect) {
        onShowMethods();
      }

      // Notificar al usuario
      toast.success('Tarjeta seleccionada correctamente');
    } catch (error) {
      console.error('Error al seleccionar la tarjeta:', error);
      toast.error('Error al seleccionar la tarjeta');
    }
  }, [onUpdateMethod, onShowMethods, showModalOnSelect]);

  const handleAddCard = () => {
    if (!isStripeAvailable) {
      toast.error('El sistema de pagos no está disponible');
      return;
    }

    if (!stripeContext?.isConnected) {
      toast.error('La cuenta de Stripe no está configurada correctamente');
      return;
    }

    setShowCardForm(true);
  };

  const handleCardSetupSuccess = async (paymentMethodId: string) => {
    try {
      setShowCardForm(false);
      setRefreshTrigger(prev => prev + 1);
      
      // Esperar a que se actualice la lista de tarjetas
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Buscar la tarjeta recién agregada
      const newCard = cards.find(card => card.id === paymentMethodId);
      if (newCard) {
        handleCardSelect(newCard);
      }
      
      toast.success('Tarjeta agregada correctamente');
    } catch (error) {
      console.error('Error al configurar la tarjeta:', error);
      toast.error('Error al actualizar la lista de tarjetas');
    }
  };

  const handleCardSetupError = (error: any) => {
    toast.error(error.message || 'Error al configurar la tarjeta');
    setShowCardForm(false);
  };

  const handleRemoveMethod = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLocalMethod(null);
    onRemoveMethod();
    setIsListExpanded(false);
  }, [onRemoveMethod]);

  // Verificar si el método está completamente seleccionado
  const isMethodComplete = useCallback(() => {
    const method = localMethod || selectedMethod;
    if (!method) return false;

    return (
      method.id &&
      method.brand &&
      method.last4 &&
      typeof method.expMonth === 'number' &&
      typeof method.expYear === 'number'
    );
  }, [localMethod, selectedMethod]);

  const methodToDisplay = localMethod || selectedMethod;

  // Estados de carga y error
  if (isCardsLoading) {
    return (
      <div className={cn(
        "w-full p-4 rounded-lg text-center",
        theme === 'dark' ? "text-gray-400" : "text-gray-500"
      )}>
        Cargando métodos de pago...
      </div>
    );
  }

  if (cardsError) {
    return (
      <div className={cn(
        "w-full p-4 rounded-lg text-center",
        theme === 'dark' ? "text-red-400" : "text-red-500"
      )}>
        Error al cargar los métodos de pago
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="space-y-3"
    >
      {/* Botón principal o tarjeta seleccionada */}
      <div
        onClick={() => !showCardForm && setIsListExpanded(!isListExpanded)}
        className={cn(
          "w-full rounded-lg cursor-pointer",
          "transition-all duration-200",
          methodToDisplay
            ? "p-3 border border-gray-100 dark:border-neutral-800"
            : "h-[52px]",
          "bg-white dark:bg-neutral-900",
          "hover:border-gray-200 dark:hover:border-neutral-700",
          "shadow-[0_1px_4px_-2px_rgba(0,0,0,0.05)]",
          "dark:shadow-[0_1px_4px_-2px_rgba(0,0,0,0.3)]"
        )}
      >
        {!methodToDisplay ? (
          <div className="flex items-center gap-3 px-4 h-full">
            <CreditCard className={cn(
              "h-[18px] w-[18px]",
              theme === 'dark' ? "text-gray-400" : "text-gray-500"
            )} />
            <span className={cn(
              "text-[15px] font-medium",
              theme === 'dark' ? "text-gray-400" : "text-gray-500"
            )}>
              Método de Pago
            </span>
          </div>
        ) : (
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
                  {methodToDisplay.name}
                </span>
                <span className={cn(
                  "text-xs mt-1",
                  theme === 'dark' 
                    ? "text-gray-400"
                    : "text-gray-500"
                )}>
                  {methodToDisplay.description}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
      </div>

      {/* Lista de tarjetas */}
      {!showCardForm && (
        <CardList
          theme={theme}
          cards={cards}
          selectedCardId={methodToDisplay?.id}
          onSelect={handleCardSelect}
          onAddCard={handleAddCard}
          onDeleteCard={deleteCard}
          isExpanded={isListExpanded}
        />
      )}

      {/* Formulario de nueva tarjeta */}
      {showCardForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            "p-4 rounded-lg border",
            theme === 'dark'
              ? "bg-neutral-900 border-neutral-800"
              : "bg-white border-gray-200"
          )}
        >
          <CardSetupForm
            onSuccess={handleCardSetupSuccess}
            onError={handleCardSetupError}
            onBack={() => setShowCardForm(false)}
            theme={theme}
          />
        </motion.div>
      )}
    </motion.div>
  );
} 