import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { bookingService } from '@/services/bookingService'
import { paymentService } from '@/services/paymentService'
import { toast } from '@/components/ui/use-toast'
import { SelectedBooking } from '@/types/bookings'

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
  date?: string
  branchId?: string
}

export function useBookings({ date, branchId }: UseBookingsParams = {}) {
  const queryClient = useQueryClient()

  // Query para obtener las reservas
  const bookingsQuery = useQuery({
    queryKey: ['bookings', date, branchId],
    queryFn: async () => {
      if (!date) return []
      
      console.log('Fetching bookings for:', { date, branchId })
      const response = await bookingService.getBookingsByDate(date, branchId)
      
      if (response.error) {
        console.error('Error fetching bookings:', response.error)
        throw new Error(response.error.message)
      }
      
      return response.data || []
    },
    enabled: !!date,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2
  })

  // Mutación para registrar pagos
  const registerPaymentMutation = useMutation<
    any,
    Error,
    RegisterPaymentParams
  >({
    mutationFn: async (params) => {
      return paymentService.registerPayment(params)
    },
    onMutate: async (newPayment) => {
      await queryClient.cancelQueries({ 
        queryKey: ['booking', newPayment.bookingId] 
      })

      const previousBooking = queryClient.getQueryData<SelectedBooking>(
        ['booking', newPayment.bookingId]
      )

      queryClient.setQueryData<SelectedBooking>(
        ['booking', newPayment.bookingId],
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

      return { previousBooking }
    },
    onError: (_, __, context) => {
      if (context?.previousBooking) {
        queryClient.setQueryData(
          ['booking', context.previousBooking.id],
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
        queryKey: ['booking', variables.bookingId]
      })
      queryClient.invalidateQueries({
        queryKey: ['bookings']
      })
    }
  })

  // Mutación para cancelar reservas
  const cancelBookingMutation = useMutation<
    any,
    Error,
    CancelBookingParams
  >({
    mutationFn: async (params) => {
      return bookingService.cancelBooking(params.bookingId, params.reason)
    },
    onMutate: async (cancelParams) => {
      await queryClient.cancelQueries({ 
        queryKey: ['booking', cancelParams.bookingId] 
      })

      const previousBooking = queryClient.getQueryData<SelectedBooking>(
        ['booking', cancelParams.bookingId]
      )

      queryClient.setQueryData<SelectedBooking>(
        ['booking', cancelParams.bookingId],
        (old) => {
          if (!old) return old
          return {
            ...old,
            paymentStatus: 'cancelled'
          }
        }
      )

      return { previousBooking }
    },
    onError: (_, __, context) => {
      if (context?.previousBooking) {
        queryClient.setQueryData(
          ['booking', context.previousBooking.id],
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
        queryKey: ['booking', variables.bookingId]
      })
      queryClient.invalidateQueries({
        queryKey: ['bookings']
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