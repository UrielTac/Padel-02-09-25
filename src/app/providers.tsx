"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutos
        gcTime: 1000 * 60 * 30, // 30 minutos
        refetchOnWindowFocus: false, // Evitar refetch al cambiar de pestaña
        refetchOnReconnect: 'always',
        refetchOnMount: false,
        retry: (failureCount, error) => {
          if (error instanceof Error && error.message.includes('404')) {
            return false
          }
          return failureCount < 2
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000)
      },
      mutations: {
        retry: 1,
        retryDelay: 1000
      }
    }
  })
}

// Mantener una instancia del cliente para el navegador
let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Servidor: Siempre crear un nuevo cliente
    return makeQueryClient()
  }
  // Cliente: Crear el cliente una sola vez
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
      <Toaster position="top-right" />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
} 