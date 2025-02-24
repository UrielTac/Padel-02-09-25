import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MobileItemCard } from './MobileItemCard';
import { ItemWithStock } from '../types';

interface MobileItemsCarouselProps {
  items: ItemWithStock[];
  theme: 'light' | 'dark';
  selectedItems: Record<string, number>;
  onQuantityChange: (itemId: string, quantity: number) => void;
  getItemPrice: (item: ItemWithStock) => number;
}

export function MobileItemsCarousel({
  items,
  theme,
  selectedItems,
  onQuantityChange,
  getItemPrice
}: MobileItemsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'center',
    containScroll: 'trimSnaps'
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="w-full relative">
      {/* Carrusel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex-[0_0_100%] min-w-0"
            >
              <MobileItemCard
                item={item}
                theme={theme}
                quantity={selectedItems[item.id] || 0}
                onQuantityChange={(quantity) => onQuantityChange(item.id, quantity)}
                price={getItemPrice(item)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Indicadores */}
      <div className="flex justify-center gap-2 mt-4">
        {items.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-200",
              index === currentIndex
                ? theme === 'dark'
                  ? "bg-white"
                  : "bg-black"
                : theme === 'dark'
                  ? "bg-neutral-700"
                  : "bg-gray-300"
            )}
            onClick={() => emblaApi?.scrollTo(index)}
          />
        ))}
      </div>
    </div>
  );
} 