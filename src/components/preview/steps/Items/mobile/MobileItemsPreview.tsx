import { useState, useEffect, useMemo } from 'react';
import { ItemsPreviewProps } from '../types';
import { ItemWithStock } from '../types';
import { withResponsiveView } from '../hoc/withResponsiveView';
import { useResponsiveStyles } from '../hooks/useResponsiveStyles';
import { MobileItemsCarousel } from './MobileItemsCarousel';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useFormItems } from '@/contexts/FormItemsContext';
import { useItems } from '@/hooks/useItems';
import { Loader2 } from 'lucide-react';
import { MobileNavigation } from '@/components/preview/layout/MobileNavigation';
import { MobileNextButton } from '@/components/preview/layout/MobileNextButton';

function MobileItemsPreviewBase({ theme, viewType, branchId, selectedSlot, ...props }: ItemsPreviewProps) {
  const { getStyle } = useResponsiveStyles('mobile');
  const { selectedItems, updateSelectedItems } = useFormItems();
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsWithStock, setItemsWithStock] = useState<ItemWithStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener items usando el hook
  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useItems(branchId);

  // Validar branchId y selectedSlot
  useEffect(() => {
    if (!branchId || !selectedSlot) {
      console.warn('Branch ID o Selected Slot no están disponibles:', { branchId, selectedSlot });
      setError('Información necesaria no está disponible.');
      setIsLoading(false);
      return;
    }
  }, [branchId, selectedSlot]);

  console.log('Branch ID:', branchId);
  console.log('Items:', items);
  console.log('Selected Slot:', selectedSlot);

  // Efecto para manejar errores y validación
  useEffect(() => {
    if (itemsError) {
      setError('Error al cargar los ítems.');
      setIsLoading(false);
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      setError('No se encontraron ítems.');
      setIsLoading(false);
      return;
    }

    setError(null);
  }, [items, itemsError]);

  // Efecto para procesar los items y su stock
  useEffect(() => {
    if (!items || !selectedSlot) {
      console.warn('No se puede procesar los ítems: items o selectedSlot no están definidos.');
      setIsLoading(true);
      return;
    }

    try {
      const processedItems = items.map(item => ({
        ...item,
        availableStock: item.stock || 0,
        baseStock: item.stock || 0,
        reservedUnits: 0,
        duration_pricing: item.duration_pricing || {}
      }));

      console.log("Processed Items:", processedItems);
      setItemsWithStock(processedItems);
      setIsLoading(false);
    } catch (err) {
      console.error("Error processing items:", err);
      setError('Error al procesar los ítems.');
      setIsLoading(false);
    }
  }, [items, selectedSlot]);

  // Filtrar items
  const filteredItems = useMemo(() => {
    return itemsWithStock.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const hasAvailableStock = item.availableStock > 0;
      return matchesSearch && hasAvailableStock;
    });
  }, [itemsWithStock, searchQuery]);

  // Función para manejar cambios en la cantidad
  const handleQuantityChange = (itemId: string, quantity: number) => {
    const newSelectedItems = { ...selectedItems };
    if (quantity === 0) {
      delete newSelectedItems[itemId];
    } else {
      newSelectedItems[itemId] = quantity;
    }
    updateSelectedItems(newSelectedItems);
  };

  // Función para obtener el precio del ítem
  const getItemPrice = (item: ItemWithStock) => {
    if (!selectedSlot) return 0;
    const durationInMinutes = selectedSlot.duration * 60;
    return item.duration_pricing[durationInMinutes.toString()] || 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className={getStyle('container')}> 
      <div className={cn(
        "min-h-screen bg-white dark:bg-neutral-900",
        "flex flex-col"
      )}> 
        {/* Título y descripción */} 
        <div className="pt-24 px-6 pb-8"> 
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4 }} 
            className="space-y-2"> 
            <h1 className={cn(
              "text-2xl font-semibold",
              theme === 'dark' ? "text-white" : "text-gray-900" 
            )}> 
              Elige tus ítems del club 
            </h1> 
            <p className={cn(
              "text-sm",
              theme === 'dark' ? "text-gray-400" : "text-gray-500" 
            )}> 
              Selecciona los artículos que deseas reservar 
            </p> 
          </motion.div> 
        </div> 

        {/* Botones de navegación */} 
        <MobileNavigation 
          theme={theme} 
          onPrev={props.onPrev} 
          isPublicView={props.isPublicView} 
          className="absolute top-6 left-6 z-50" 
        /> 
        <MobileNextButton 
          theme={theme} 
          onNext={props.onNext} 
          isDisabled={false} 
          isPublicView={props.isPublicView} 
        /> 

        {/* Carrusel de ítems */} 
        <div className="flex-1"> 
          <MobileItemsCarousel 
            items={filteredItems} 
            theme={theme} 
            selectedItems={selectedItems} 
            onQuantityChange={handleQuantityChange} 
            getItemPrice={getItemPrice} 
          /> 
        </div> 
      </div> 
    </div> 
  ); 
}

// Aplicar el HOC con opciones específicas para la vista móvil
export const MobileItemsPreview = withResponsiveView(MobileItemsPreviewBase, {
  styleKey: 'container',
  fullWidth: true,
  disableWrapper: true
}); 