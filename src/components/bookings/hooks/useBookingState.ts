import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { bookingService } from '@/services/bookingService'
import { type SelectedBooking } from '@/types/bookings'

interface UseBookingStateProps {
  selectedDate: Date
  branchId?: string
}

export function useBookingState({ selectedDate, branchId }: UseBookingStateProps) {
  const [selectedBooking, setSelectedBooking] = useState<SelectedBooking | null>(null)
  const queryClient = useQueryClient()

  // Formatear la fecha para la query
  const formattedDate = selectedDate.toISOString().split('T')[0]

  // Query principal optimizada
  const {
    data: bookingsData,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['bookings', formattedDate, branchId],
    queryFn: () => bookingService.getBookingsByDate(formattedDate, branchId),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!branchId,
    placeholderData: (previousData) => previousData
  })

  // Prefetch optimizado
  useEffect(() => {
    if (!branchId) return

    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)
    const prevDay = new Date(selectedDate)
    prevDay.setDate(prevDay.getDate() - 1)

    const prefetchDates = [nextDay, prevDay]

    prefetchDates.forEach(date => {
      const formattedPrefetchDate = date.toISOString().split('T')[0]
      queryClient.prefetchQuery({
        queryKey: ['bookings', formattedPrefetchDate, branchId],
        queryFn: () => bookingService.getBookingsByDate(formattedPrefetchDate, branchId),
        staleTime: 1000 * 60 * 5
      })
    })
  }, [selectedDate, branchId, queryClient])

  const handleBookingCreated = async (newBooking: SelectedBooking) => {
    if (!branchId) return

    await queryClient.invalidateQueries({
      queryKey: ['bookings', formattedDate, branchId]
    })
  }

  return {
    bookings: bookingsData?.data || [],
    isLoading,
    isError,
    selectedBooking,
    setSelectedBooking,
    handleBookingCreated
  }
} 