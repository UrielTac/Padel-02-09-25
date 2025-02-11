'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useStripe } from '@/contexts/StripeContext';

interface StoredCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export function useStoredCards(refreshTrigger = 0) {
  const [cards, setCards] = useState<StoredCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  let stripeContext;
  let isConnected = false;

  try {
    stripeContext = useStripe();
    isConnected = stripeContext?.isConnected || false;
  } catch (error) {
    console.error('[StoredCards] Error al obtener contexto de Stripe:', error);
    setError(error instanceof Error ? error : new Error('Error al obtener contexto de Stripe'));
    setIsLoading(false);
    return { cards: [], isLoading: false, error, deleteCard: async () => {} };
  }

  const { stripeAccountId } = stripeContext;
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  const loadCards = useCallback(async () => {
    if (!stripeAccountId || !isConnected) {
      console.log('[StoredCards] No hay cuenta de Stripe conectada:', {
        stripeAccountId,
        isConnected
      });
      setCards([]);
      setIsLoading(false);
      return;
    }

    try {
      console.log('[StoredCards] 🔄 Iniciando carga de tarjetas:', {
        stripeAccountId,
        refreshTrigger,
        retryCount: retryCountRef.current
      });
      
      const response = await fetch('/api/stripe/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stripeAccountId })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[StoredCards] ❌ Error en la respuesta:', {
          status: response.status,
          statusText: response.statusText,
          error: data
        });
        throw new Error(data.error || 'Error al cargar las tarjetas guardadas');
      }

      if (!mountedRef.current) return;

      console.log('[StoredCards] ✅ Respuesta recibida:', {
        paymentMethods: data.paymentMethods,
        count: data.paymentMethods?.length || 0,
        customerId: data.customerId
      });

      const newCards = data.paymentMethods || [];
      
      // Solo reintentar si no hay tarjetas Y no hemos excedido los reintentos
      if (newCards.length === 0 && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        console.log('[StoredCards] 🔄 Reintentando carga:', {
          attempt: retryCountRef.current,
          maxRetries: MAX_RETRIES
        });
        setTimeout(loadCards, RETRY_DELAY);
        return;
      }

      setCards(newCards);
      setIsLoading(false);

      console.log('[StoredCards] 💾 Estado actualizado:', {
        cardCount: newCards.length,
        lastUpdate: new Date().toISOString(),
        retryCount: retryCountRef.current
      });

    } catch (err) {
      if (!mountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[StoredCards] ❌ Error al cargar las tarjetas:', {
        message: errorMessage,
        stripeAccountId,
        error: err
      });
      
      setError(err as Error);
      setIsLoading(false);
    }
  }, [stripeAccountId, isConnected, refreshTrigger]);

  useEffect(() => {
    mountedRef.current = true;
    retryCountRef.current = 0;
    setIsLoading(true);
    loadCards();

    return () => {
      mountedRef.current = false;
    };
  }, [loadCards]);

  const deleteCard = async (cardId: string) => {
    if (!stripeAccountId) {
      console.error('[StoredCards] ❌ No hay cuenta de Stripe para eliminar tarjeta');
      return;
    }

    try {
      console.log('[StoredCards] 🗑️ Eliminando tarjeta:', { 
        cardId, 
        stripeAccountId 
      });

      const response = await fetch(`/api/stripe/payment-methods/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stripeAccountId })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[StoredCards] ❌ Error al eliminar:', {
          status: response.status,
          statusText: response.statusText,
          error: data
        });
        throw new Error(data.error || 'Error al eliminar la tarjeta');
      }

      if (!mountedRef.current) return;

      console.log('[StoredCards] ✅ Tarjeta eliminada:', { cardId });
      setCards(prevCards => prevCards.filter(card => card.id !== cardId));
      
      console.log('[StoredCards] 💾 Estado actualizado después de eliminar');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[StoredCards] ❌ Error al eliminar la tarjeta:', {
        message: errorMessage,
        cardId,
        stripeAccountId,
        error: err
      });
      throw err;
    }
  };

  return {
    cards,
    isLoading,
    error,
    deleteCard
  };
} 