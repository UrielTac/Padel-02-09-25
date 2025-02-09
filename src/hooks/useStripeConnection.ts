'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface StripeConnectionState {
  stripeAccountId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  charges_enabled: boolean;
}

export function useStripeConnection(empresaId: string | null) {
  const supabase = createClientComponentClient();
  const [state, setState] = useState<StripeConnectionState>({
    stripeAccountId: null,
    isConnected: false,
    isLoading: true,
    error: null,
    charges_enabled: false
  });

  useEffect(() => {
    const mounted = true;
    let timeoutId: NodeJS.Timeout;

    async function checkStripeConnection() {
      if (!empresaId) {
        console.log('[StripeConnection] No se proporcionó ID de empresa');
        if (mounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: new Error('No se proporcionó ID de empresa')
          }));
        }
        return;
      }

      try {
        console.log('[StripeConnection] Verificando conexión para empresa:', empresaId);

        // Obtener la conexión activa
        const { data: connection, error: connectionError } = await supabase
          .from('stripe_connections')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('is_active', true)
          .maybeSingle();

        if (connectionError) {
          console.error('[StripeConnection] Error al verificar conexión:', {
            error: connectionError,
            empresaId
          });
          throw new Error(`Error al verificar conexión: ${connectionError.message}`);
        }

        if (!connection) {
          console.log('[StripeConnection] No se encontró conexión activa');
          if (mounted) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              error: new Error('No hay conexión Stripe configurada')
            }));
          }
          return;
        }

        // Verificar el estado de la cuenta
        const { data: accountStatus, error: statusError } = await supabase
          .from('stripe_account_status')
          .select('*')
          .eq('stripe_account_id', connection.stripe_account_id)
          .maybeSingle();

        if (statusError) {
          console.error('[StripeConnection] Error al verificar estado:', {
            error: statusError,
            accountId: connection.stripe_account_id
          });
          throw new Error(`Error al verificar estado: ${statusError.message}`);
        }

        console.log('[StripeConnection] Estado verificado:', {
          accountId: connection.stripe_account_id,
          charges_enabled: accountStatus?.charges_enabled
        });

        if (mounted) {
          setState({
            stripeAccountId: connection.stripe_account_id,
            isConnected: true,
            isLoading: false,
            error: null,
            charges_enabled: accountStatus?.charges_enabled ?? false
          });
        }

      } catch (error) {
        console.error('[StripeConnection] Error en la verificación:', {
          error,
          empresaId
        });

        if (mounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error : new Error('Error desconocido')
          }));
        }
      }
    }

    // Iniciar verificación con un pequeño retraso
    timeoutId = setTimeout(checkStripeConnection, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [empresaId, supabase]);

  return state;
} 