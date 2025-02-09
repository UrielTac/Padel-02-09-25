'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/auth-helpers-nextjs';
import { getSupabaseClient } from '@/lib/supabase-client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseClient();

    // Verificar la sesión inicial
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error al obtener la sesión:', error);
          if (mounted) {
            setState(prev => ({ ...prev, error, isLoading: false }));
          }
          return;
        }

        if (mounted) {
          setState(prev => ({
            ...prev,
            user: session?.user || null,
            isLoading: false
          }));
        }
      } catch (error) {
        console.error('Error inesperado:', error);
        if (mounted) {
          setState(prev => ({
            ...prev,
            error: error as Error,
            isLoading: false
          }));
        }
      }
    };

    // Suscribirse a cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setState(prev => ({
          ...prev,
          user: session?.user || null,
          isLoading: false
        }));
      }
    });

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
} 