import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { bookingService } from '@/services/bookingService'
import { paymentService } from '@/services/paymentService'
import { toast } from '@/components/ui/use-toast'
import { SelectedBooking } from '@/types/bookings'
import { queryKeys } from '@/config/query-keys'
import { keepPreviousData } from '@tanstack/react-query'

interface RegisterPaymentParams {
  bookingId: string
  depositAmount: number
  paymentMethod: string
  notes?: string
}

interface CancelBookingParams {
  bookingId: string
  reason?: string
}

interface UseBookingsParams {
  date?: Date
  branchId?: string
}

interface MutationContext {
  previousBooking: SelectedBooking | null
}

function formatDateForQuery(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function useBookings({ date, branchId }: UseBookingsParams = {}) {
  const queryClient = useQueryClient()

  // Query optimizada para obtener las reservas
  const bookingsQuery = useQuery({
    queryKey: queryKeys.bookings.list({ 
      date: date ? formatDateForQuery(date) : undefined, 
      branchId 
    }),
    queryFn: async () => {
      if (!date) return []
      
      const formattedDate = formatDateForQuery(date)
      console.log('🔍 Fetching bookings for:', { date: formattedDate, branchId })
      
      const response = await bookingService.getBookingsByDate(formattedDate, branchId)
      
      if (response.error) {
        console.error('❌ Error fetching bookings:', response.error)
        throw new Error(response.error.message)
      }
      
      console.log('✅ Bookings loaded:', {
        date: formattedDate,
        branchId,
        count: response.data?.length || 0
      })
      
      return response.data || []
    },
    enabled: !!date,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('404')) {
        return false
      }
      return failureCount < 2
    }
  })

  // Mutación optimizada para registrar pagos
  const registerPaymentMutation = useMutation<
    any,
    Error,
    RegisterPaymentParams,
    MutationContext
  >({
    mutationFn: async (params) => {
      return paymentService.registerPayment(params)
    },
    onMutate: async (newPayment) => {
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.bookings.detail(newPayment.bookingId)
      })

      const previousBooking = queryClient.getQueryData<SelectedBooking>(
        queryKeys.bookings.detail(newPayment.bookingId)
      )

      queryClient.setQueryData<SelectedBooking>(
        queryKeys.bookings.detail(newPayment.bookingId),
        (old) => {
          if (!old) return old
          const totalPaid = (old.depositAmount || 0) + newPayment.depositAmount
          return {
            ...old,
            depositAmount: totalPaid,
            paymentStatus: totalPaid >= old.totalAmount ? 'completed' : 'partial'
          }
        }
      )

      return { previousBooking: previousBooking || null }
    },
    onError: (_, __, context) => {
      if (context?.previousBooking) {
        queryClient.setQueryData(
          queryKeys.bookings.detail(context.previousBooking.id),
          context.previousBooking
        )
      }
      toast({
        description: 'Error al procesar el pago',
        variant: 'destructive'
      })
    },
    onSuccess: () => {
      toast({
        description: 'Pago registrado correctamente',
        variant: 'default'
      })
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(variables.bookingId)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.lists()
      })
    }
  })

  // Mutación optimizada para cancelar reservas
  const cancelBookingMutation = useMutation<
    any,
    Error,
    CancelBookingParams,
    MutationContext
  >({
    mutationFn: async (params) => {
      return bookingService.cancelBooking(params.bookingId, params.reason)
    },
    onMutate: async (cancelParams) => {
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.bookings.detail(cancelParams.bookingId)
      })

      const previousBooking = queryClient.getQueryData<SelectedBooking>(
        queryKeys.bookings.detail(cancelParams.bookingId)
      )

      queryClient.setQueryData<SelectedBooking>(
        queryKeys.bookings.detail(cancelParams.bookingId),
        (old) => {
          if (!old) return old
          return {
            ...old,
            paymentStatus: 'cancelled'
          }
        }
      )

      return { previousBooking: previousBooking || null }
    },
    onError: (_, __, context) => {
      if (context?.previousBooking) {
        queryClient.setQueryData(
          queryKeys.bookings.detail(context.previousBooking.id),
          context.previousBooking
        )
      }
      toast({
        description: 'Error al cancelar la reserva',
        variant: 'destructive'
      })
    },
    onSuccess: () => {
      toast({
        description: 'Reserva cancelada correctamente',
        variant: 'default'
      })
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(variables.bookingId)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.lists()
      })
    }
  })

  return {
    bookings: bookingsQuery.data || [],
    isLoading: bookingsQuery.isLoading,
    isError: bookingsQuery.isError,
    error: bookingsQuery.error,
    refetch: bookingsQuery.refetch,
    registerPayment: registerPaymentMutation.mutate,
    isRegistering: registerPaymentMutation.isPending,
    cancelBooking: cancelBookingMutation.mutate,
    isCancelling: cancelBookingMutation.isPending
  }
} 