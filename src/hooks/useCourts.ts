import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useCallback } from 'react'
import { courtService } from '@/services/courtService'
import type { Court } from '@/types/court'

interface UseCourtOptions {
  branchId?: string
  onlyActive?: boolean
}

const processCourt = (court: any): Court => {
  const available_durations = Array.isArray(court.available_durations)
    ? [...court.available_durations]
        .map(d => Number(d))
        .filter(d => !isNaN(d))
        .sort((a, b) => a - b)
    : []

  const duration_pricing: Record<string, number> = {}
  if (typeof court.duration_pricing === 'object' && court.duration_pricing) {
    Object.entries(court.duration_pricing).forEach(([key, value]) => {
      const numValue = Number(value)
      if (!isNaN(numValue)) {
        duration_pricing[key] = numValue
      }
    })
  }

  available_durations.forEach(duration => {
    const key = duration.toString()
    if (!(key in duration_pricing)) {
      duration_pricing[key] = 0
    }
  })

  const custom_pricing = typeof court.custom_pricing === 'object' && court.custom_pricing
    ? court.custom_pricing
    : {}

  console.log('Procesando cancha en hook:', {
    name: court.name,
    available_durations,
    duration_pricing,
    custom_pricing
  })

  return {
    ...court,
    available_durations,
    duration_pricing,
    custom_pricing
  } as Court
}

export function useCourts({ branchId, onlyActive = false }: UseCourtOptions) {
  const queryClient = useQueryClient()

  // Memoizar la función de selección
  const selectFn = useCallback((response: any) => {
    if (!response?.data) return []

    let courts = response.data

    if (onlyActive) {
      courts = courts.filter((court: Court) => court.is_active)
    }

    return courts.map(processCourt)
  }, [onlyActive])

  // Memoizar la query key para evitar re-renders innecesarios
  const queryKey = useMemo(() => ['courts', branchId, onlyActive], [branchId, onlyActive])

  return useQuery({
    queryKey,
    queryFn: () => courtService.getCourtsByBranch(branchId || ''),
    enabled: !!branchId,
    select: selectFn,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos,
    // Optimizar el manejo de cache
    placeholderData: (previousData) => previousData,
  })
} 