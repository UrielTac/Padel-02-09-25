'use client';

import { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import type { RentalSelection } from '@/types/items';
import { validateRental, calculateRentalPrice } from '@/types/rentals';

interface FormItemsContextType {
  rentals: RentalSelection[];
  selectedItems: Record<string, number>;
  totalPrice: number;
  updateRentals: (rentals: RentalSelection[]) => void;
  updateSelectedItems: (items: Record<string, number>) => void;
  clearItems: () => void;
}

const FormItemsContext = createContext<FormItemsContextType | undefined>(undefined);

interface FormItemsProviderProps {
  children: ReactNode;
}

export function FormItemsProvider({ children }: FormItemsProviderProps) {
  const [rentals, setRentals] = useState<RentalSelection[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [totalPrice, setTotalPrice] = useState(0);

  const validateAndTransformRental = useCallback((rental: RentalSelection): RentalSelection | null => {
    // Validación básica
    if (!rental.itemId || typeof rental.quantity !== 'number' || rental.quantity <= 0) {
      console.warn('Rental inválido - datos básicos:', rental);
      return null;
    }

    // Validar precio por unidad
    if (typeof rental.pricePerUnit !== 'number' || rental.pricePerUnit <= 0) {
      console.warn('Rental inválido - precio por unidad:', rental);
      return null;
    }

    // Validar duración
    if (!rental.duration || rental.duration <= 0) {
      console.warn('Rental inválido - duración:', rental);
      return null;
    }

    // Calcular precio total
    const calculatedTotal = rental.quantity * rental.pricePerUnit;
    
    console.log('Rental validado y transformado:', {
      itemId: rental.itemId,
      quantity: rental.quantity,
      pricePerUnit: rental.pricePerUnit,
      duration: rental.duration,
      calculatedTotal
    });

    return {
      ...rental,
      totalPrice: calculatedTotal,
      price: calculatedTotal // Para compatibilidad
    };
  }, []);

  const updateRentals = useCallback((newRentals: RentalSelection[]) => {
    console.log('FormItemsContext - Actualizando rentals:', {
      rentalsActuales: rentals,
      nuevosRentals: newRentals
    });
    
    // Validar y transformar rentals
    const validRentals = newRentals
      .map(validateAndTransformRental)
      .filter((rental): rental is RentalSelection => rental !== null);

    if (validRentals.length !== newRentals.length) {
      console.warn('Se eliminaron rentals inválidos:', {
        original: newRentals.length,
        valid: validRentals.length,
        rentalsEliminados: newRentals.filter(r => !validRentals.find(v => v.itemId === r.itemId))
      });
    }

    // Actualizar estado
    setRentals(validRentals);

    // Calcular precio total
    const newTotal = validRentals.reduce((sum, rental) => sum + rental.totalPrice, 0);
    setTotalPrice(newTotal);

    // Actualizar selectedItems
    const newSelectedItems = validRentals.reduce((acc, rental) => {
      acc[rental.itemId] = rental.quantity;
      return acc;
    }, {} as Record<string, number>);
    setSelectedItems(newSelectedItems);

    console.log('FormItemsContext - Estado actualizado:', {
      rentals: validRentals,
      selectedItems: newSelectedItems,
      totalPrice: newTotal,
      rentalsLength: validRentals.length
    });
  }, [validateAndTransformRental]);

  const updateSelectedItems = useCallback((newItems: Record<string, number>) => {
    console.log('FormItemsContext - Actualizando selectedItems:', newItems);
    
    // Filtrar items con cantidad 0 o negativa
    const validItems = Object.entries(newItems).reduce((acc, [id, qty]) => {
      if (qty > 0) {
        acc[id] = qty;
      }
      return acc;
    }, {} as Record<string, number>);

    setSelectedItems(validItems);

    // Actualizar rentals correspondientes
    const updatedRentals = rentals.filter(rental => validItems[rental.itemId]);
    if (updatedRentals.length !== rentals.length) {
      console.log('Actualizando rentals basado en selectedItems:', {
        previous: rentals.length,
        current: updatedRentals.length
      });
      setRentals(updatedRentals);
      
      // Recalcular precio total
      const newTotal = updatedRentals.reduce((sum, rental) => sum + rental.totalPrice, 0);
      setTotalPrice(newTotal);
    }
  }, [rentals]);

  const clearItems = useCallback(() => {
    setRentals([]);
    setSelectedItems({});
    setTotalPrice(0);
  }, []);

  return (
    <FormItemsContext.Provider
      value={{
        rentals,
        selectedItems,
        totalPrice,
        updateRentals,
        updateSelectedItems,
        clearItems,
      }}
    >
      {children}
    </FormItemsContext.Provider>
  );
}

export function useFormItems() {
  const context = useContext(FormItemsContext);
  if (context === undefined) {
    throw new Error('useFormItems must be used within a FormItemsProvider');
  }
  return context;
} 