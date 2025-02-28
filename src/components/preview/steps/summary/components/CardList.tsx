import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, X } from "lucide-react";
import { CardBrandIcon } from "./CardBrandIcon";
import { toast } from "sonner";

interface StoredCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface CardListProps {
  theme: 'light' | 'dark';
  cards: StoredCard[];
  selectedCardId?: string;
  onSelect: (card: StoredCard) => void;
  onAddCard: () => void;
  onDeleteCard?: (cardId: string) => void;
  isExpanded?: boolean;
}

function CardItem({
  card,
  isSelected,
  onClick,
  onDelete,
  theme
}: {
  card: StoredCard;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: () => void;
  theme: 'light' | 'dark';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "p-3 rounded-lg cursor-pointer group",
        "transition-all duration-200 ease-in-out",
        theme === 'dark'
          ? isSelected 
            ? "bg-neutral-800" 
            : "hover:bg-neutral-800/50"
          : isSelected 
            ? "bg-gray-100" 
            : "hover:bg-gray-50"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn(
            "p-1.5 rounded-md transition-colors",
            theme === 'dark' 
              ? "bg-neutral-700 group-hover:bg-neutral-600" 
              : "bg-gray-100 group-hover:bg-gray-200"
          )}>
            <CardBrandIcon 
              brand={card.brand} 
              className={theme === 'dark' ? "text-gray-300" : "text-gray-600"} 
            />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <p className={cn(
              "text-sm font-medium truncate",
              theme === 'dark' ? "text-gray-200" : "text-gray-900"
            )}>
              •••• {card.last4}
            </p>
            <p className={cn(
              "text-xs",
              theme === 'dark' ? "text-gray-400" : "text-gray-500"
            )}>
              Expira: {card.expMonth.toString().padStart(2, '0')}/{card.expYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSelected && (
            <Check className={cn(
              "h-4 w-4",
              theme === 'dark' ? "text-blue-400" : "text-blue-600"
            )} />
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={cn(
                "p-1 rounded-md opacity-0 group-hover:opacity-100",
                "transition-all duration-200",
                theme === 'dark' 
                  ? "hover:bg-neutral-700 text-gray-400" 
                  : "hover:bg-gray-200 text-gray-500"
              )}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function CardList({
  theme,
  cards,
  selectedCardId,
  onSelect,
  onAddCard,
  onDeleteCard,
  isExpanded = false
}: CardListProps) {
  const handleDeleteCard = async (cardId: string) => {
    try {
      if (onDeleteCard) {
        await onDeleteCard(cardId);
        toast.success('Tarjeta eliminada correctamente');
      }
    } catch (error) {
      console.error('Error al eliminar la tarjeta:', error);
      toast.error('Error al eliminar la tarjeta');
    }
  };

  return (
    <motion.div
      initial={false}
      animate={isExpanded ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "overflow-hidden rounded-lg border mt-1",
        theme === 'dark' 
          ? "bg-neutral-900 border-neutral-800" 
          : "bg-white border-gray-200"
      )}
    >
      <div className="divide-y divide-gray-100 dark:divide-neutral-800">
        <div className="px-2 py-1.5">
          <p className={cn(
            "text-[10px] font-medium text-center",
            theme === 'dark' ? "text-gray-400" : "text-gray-500"
          )}>
            Tarjetas guardadas
          </p>
        </div>

        <div className="space-y-1 p-2">
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              isSelected={card.id === selectedCardId}
              onClick={() => onSelect(card)}
              onDelete={onDeleteCard ? () => handleDeleteCard(card.id) : undefined}
              theme={theme}
            />
          ))}
          
          <motion.button
            onClick={onAddCard}
            className={cn(
              "w-full p-3 rounded-lg",
              "flex items-center gap-3",
              "transition-all duration-200",
              theme === 'dark'
                ? "hover:bg-neutral-800/50 text-gray-400"
                : "hover:bg-gray-50 text-gray-600"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-md",
              theme === 'dark' ? "bg-neutral-800" : "bg-gray-100"
            )}>
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-sm">Agregar nueva tarjeta</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
} 