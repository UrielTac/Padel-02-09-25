import { FormStepField } from "@/types/form-steps";
import { PreviewContainer } from "../layout/PreviewContainer";
import { Button } from "@/components/ui/button";
import { Share2, Download, MapPin, Calendar, Clock, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from 'react';

interface FarewellPreviewProps {
  field: FormStepField;
  theme: 'light' | 'dark';
  viewType: "mobile" | "desktop";
  onNext: () => void;
  onPrev: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

// Separamos los datos en un objeto más organizado
const RESERVATION_DATA = {
  datetime: {
    icon: Calendar,
    title: "Fecha y Hora",
    primary: "Jueves 25 de Enero, 2024",
    secondary: "15:00 - 16:30",
  },
  location: {
    icon: MapPin,
    title: "Ubicación",
    primary: "Sucursal Centro",
    secondary: "Av. Principal 123, Ciudad",
  },
  court: {
    icon: Clock,
    title: "Cancha",
    primary: "Cancha Principal",
    secondary: "Cubierta • Cristal Panorámico",
  },
  code: {
    icon: QrCode,
    title: "Código de Reserva",
    primary: "#PAD12345",
    secondary: "Presenta este código al llegar",
  },
} as const;

export function FarewellPreview({ 
  field, 
  theme, 
  viewType, 
  onNext 
}: FarewellPreviewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Efecto para el sonido de éxito
  useEffect(() => {
    audioRef.current = new Audio('/sonidos/bell-congratulations-epic-stock-media-1-00-01.mp3');
    audioRef.current.volume = 0.5;

    const playSound = async () => {
      try {
        await audioRef.current?.play();
      } catch (error) {
        console.error('Error reproduciendo sonido:', error);
      }
    };

    playSound();

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  // Manejadores de acciones
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Reserva de Padel',
          text: `Reserva confirmada para ${RESERVATION_DATA.datetime.primary} a las ${RESERVATION_DATA.datetime.secondary}`,
          url: window.location.href,
        });
      }
    } catch (error) {
      console.error('Error compartiendo:', error);
    }
  };

  const handleDownload = () => {
    console.log('Descargando comprobante...');
  };

  return (
    <PreviewContainer viewType={viewType} theme={theme}>
      <div className="min-h-full flex flex-col">
        {/* Encabezado con animación */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className={cn(
            "mx-auto w-12 h-12 rounded-full mb-4 flex items-center justify-center",
            theme === 'dark' ? 'bg-neutral-800/50' : 'bg-gray-100'
          )}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.2
              }}
              className={cn(
                "w-6 h-6 rounded-full",
                theme === 'dark' ? 'bg-neutral-700' : 'bg-gray-900'
              )}
            />
          </div>
          <h1 className={cn(
            "text-xl font-semibold mb-2",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            ¡Reserva Exitosa!
          </h1>
          <p className={cn(
            "text-sm",
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            Tu reserva ha sido confirmada
          </p>
        </motion.div>

        {/* Detalles de la reserva */}
        <div className="flex-1 px-6">
          <div className={cn(
            "rounded-xl overflow-hidden",
            theme === 'dark' ? 'bg-neutral-900/50' : 'bg-gray-50'
          )}>
            {Object.entries(RESERVATION_DATA).map(([key, data], index) => {
              const Icon = data.icon;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (index * 0.1) }}
                  className={cn(
                    "flex items-start gap-4 p-4",
                    index !== Object.entries(RESERVATION_DATA).length - 1 && 
                    (theme === 'dark' ? 'border-b border-neutral-800' : 'border-b border-gray-200')
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    theme === 'dark' ? 'bg-neutral-800' : 'bg-white'
                  )}>
                    <Icon className={cn(
                      "w-4 h-4",
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs font-medium mb-1",
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    )}>
                      {data.title}
                    </p>
                    <p className={cn(
                      "text-sm font-medium truncate",
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      {data.primary}
                    </p>
                    <p className={cn(
                      "text-xs truncate",
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    )}>
                      {data.secondary}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Acciones */}
        <motion.div 
          className="p-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleShare}
              variant="outline"
              className={cn(
                "flex-1 gap-2",
                theme === 'dark' ? 'border-neutral-800 hover:bg-neutral-800' : 'hover:bg-gray-100'
              )}
            >
              <Share2 className="w-4 h-4" />
              Compartir
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className={cn(
                "flex-1 gap-2",
                theme === 'dark' ? 'border-neutral-800 hover:bg-neutral-800' : 'hover:bg-gray-100'
              )}
            >
              <Download className="w-4 h-4" />
              Descargar
            </Button>
          </div>

          <p className={cn(
            "text-xs text-center",
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            Te hemos enviado un email con todos los detalles
          </p>

          <Button
            onClick={onNext}
            variant="ghost"
            className="w-full text-sm font-medium"
          >
            Finalizar
          </Button>
        </motion.div>
      </div>
    </PreviewContainer>
  );
} 