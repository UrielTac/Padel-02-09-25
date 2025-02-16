import { useQuery } from '@tanstack/react-query'
import { bookingQueryService } from '@/services/bookingQueryService'
import { toast } from '@/components/ui/use-toast'
import type { SelectedBooking } from '@/types/bookings'
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

interface UseBookingsProps {
  selectedDate?: string
  branchId?: string
}

interface MutationContext {
  previousBooking: SelectedBooking | null
}

function formatDateForQuery(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function useBookings(params?: UseBookingsProps) {
  const { selectedDate, branchId } = params || {}

  const { 
    data: bookings = [], 
    isLoading, 
    isError,
    refetch
  } = useQuery({
    queryKey: ['bookings', selectedDate, branchId],
    queryFn: () => bookingQueryService.getBookingsByDate(
      selectedDate || new Date().toISOString().split('T')[0], 
      branchId
    ),
    enabled: true
  })

  const registerPayment = async (params: RegisterPaymentParams) => {
    try {
      const result = await bookingQueryService.registerPayment(params)
      if (result.error) {
        toast({
          title: 'Error al registrar pago',
          description: result.error.message,
          variant: 'destructive'
        })
        throw result.error
      }
      toast({
        title: 'Pago registrado',
        description: 'El pago se ha registrado exitosamente',
        variant: 'default'
      })
      await refetch()
    } catch (error) {
      console.error('Error al registrar pago:', error)
      throw error
    }
  }

  const cancelBooking = async (params: CancelBookingParams) => {
    try {
      const result = await bookingQueryService.cancelBooking(params.bookingId, params.reason)
      if (result.error) {
        toast({
          title: 'Error al cancelar reserva',
          description: result.error.message,
          variant: 'destructive'
        })
        throw result.error
      }
      toast({
        title: 'Reserva cancelada',
        description: 'La reserva se ha cancelado exitosamente',
        variant: 'default'
      })
      await refetch()
    } catch (error) {
      console.error('Error al cancelar reserva:', error)
      throw error
    }
  }

  return {
    bookings,
    isLoading,
    isError,
    refetch,
    registerPayment,
    cancelBooking
  }
} 