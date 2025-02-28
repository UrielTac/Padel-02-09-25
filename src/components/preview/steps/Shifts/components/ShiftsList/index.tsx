import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Clock, Sun, Loader2 } from 'lucide-react';
import { AvailabilitySlot } from '@/types/availability';
import { getCourtTypeLabel } from '../../utils/courtTypeUtils';

interface ShiftsListProps {
  slots: AvailabilitySlot[];
  selectedShift: string | null;
  onShiftSelect: (slot: AvailabilitySlot) => void;
  theme: 'light' | 'dark';
  viewType: 'mobile' | 'desktop';
  loading?: boolean;
  error?: string;
}

const ShiftCard = memo(({ 
  slot, 
  isSelected, 
  onSelect, 
  theme 
}: { 
  slot: AvailabilitySlot;
  isSelected: boolean;
  onSelect: () => void;
  theme: 'light' | 'dark';
}) => (
  <motion.button
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    onClick={onSelect}
    className={cn(
      "relative w-full px-3 py-2 text-left transition-colors duration-200 rounded-lg",
      theme === 'dark'
        ? "hover:bg-zinc-800/30"
        : "hover:bg-gray-100",
      isSelected && (
        theme === 'dark'
          ? "bg-zinc-800/70"
          : "bg-gray-100/70"
      )
    )}
  >
    <AnimatePresence>
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ 
            opacity: 1,
            scale: 1,
            transition: { 
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }
          }}
          exit={{ 
            opacity: 0,
            scale: 0.95,
            transition: {
              duration: 0.15,
              ease: "easeOut"
            }
          }}
          className={cn(
            "absolute inset-0 z-0 rounded-lg",
            theme === 'dark' 
              ? "bg-zinc-800/70"
              : "bg-gray-200/70"
          )}
        />
      )}
    </AnimatePresence>

    <motion.div 
      className="relative z-10 flex-1 min-w-0"
      animate={{
        color: isSelected 
          ? theme === 'dark' 
            ? "#e5e7eb"
            : "#374151"
          : theme === 'dark'
            ? "#e5e7eb"
            : "#1f2937"
      }}
      transition={{ 
        duration: 0.25,
        ease: [0.32, 0.72, 0, 1]
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <motion.p
          className="font-medium text-sm"
          animate={{
            color: isSelected 
              ? theme === 'dark'
                ? "#ffffff"
                : "#111827"
              : theme === 'dark'
                ? "#ffffff"
                : "#111827"
          }}
        >
          {`${slot.startTime} - ${slot.endTime}`}
        </motion.p>
        <motion.span
          className="text-xs font-medium"
          animate={{
            color: isSelected 
              ? theme === 'dark'
                ? "#e5e7eb"
                : "#374151"
              : theme === 'dark'
                ? "#d1d5db"
                : "#111827"
          }}
        >
          ${slot.price?.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </motion.span>
      </div>
      <div className="space-y-0.5">
        <motion.p
          className="text-[11px]"
          animate={{
            color: isSelected 
              ? theme === 'dark'
                ? "#d1d5db"
                : "#4b5563"
              : theme === 'dark'
                ? "#9ca3af"
                : "#6b7280"
          }}
        >
          {slot.courtName} • {getCourtTypeLabel(slot.courtType)}
        </motion.p>
      </div>
    </motion.div>
  </motion.button>
));

export function ShiftsList({ 
  slots, 
  selectedShift, 
  onShiftSelect, 
  theme,
  viewType,
  loading,
  error 
}: ShiftsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className={cn(
          "text-sm ml-2",
          theme === 'dark' ? "text-gray-400" : "text-gray-500"
        )}>
          Cargando turnos disponibles...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-2">
        <p className={cn(
          "text-sm text-center",
          theme === 'dark' ? "text-red-400" : "text-red-500"
        )}>
          {error}
        </p>
      </div>
    );
  }

  if (!slots.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-2">
        <p className={cn(
          "text-sm text-center",
          theme === 'dark' ? "text-gray-400" : "text-gray-500"
        )}>
          No hay turnos disponibles para los filtros seleccionados
        </p>
      </div>
    );
  }

  return (
    <div className="px-6">
      <div className={cn(
        "space-y-3 h-[calc(100vh-460px)] overflow-y-auto",
        "scrollbar-none"
      )}>
        {slots.map((slot) => {
          const isSelected = selectedShift === slot.id;
          
          return (
            <motion.button
              key={`${slot.id}-${slot.startTime}-${slot.courtId}`}
              onClick={() => onShiftSelect(slot)}
              className={cn(
                "relative w-full px-4 py-3 text-left rounded-lg",
                "transition-colors duration-200",
                theme === 'dark'
                  ? [
                      "bg-zinc-800/20",
                      isSelected && "bg-[#000000E6]"
                    ]
                  : [
                      "bg-gray-100/60",
                      isSelected && "bg-[#000000E6]"
                    ]
              )}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <p className={cn(
                    "font-medium text-sm",
                    isSelected
                      ? "text-white"
                      : theme === 'dark'
                        ? "text-gray-200"
                        : "text-gray-900"
                  )}>
                    {`${slot.startTime} - ${slot.endTime}`}
                  </p>
                  <span className={cn(
                    "text-xs font-medium",
                    isSelected
                      ? "text-gray-300"
                      : theme === 'dark'
                        ? "text-gray-400"
                        : "text-gray-700"
                  )}>
                    ${slot.price?.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <p className={cn(
                    "text-[11px]",
                    isSelected
                      ? "text-gray-300"
                      : theme === 'dark'
                        ? "text-gray-400"
                        : "text-gray-600"
                  )}>
                    {slot.courtName} • {getCourtTypeLabel(slot.courtType)}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
} 