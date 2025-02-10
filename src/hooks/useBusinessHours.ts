import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createSupabaseClient } from "@/lib/supabase"
import { useBranches } from "./useBranches"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useCallback, useMemo } from 'react'
import { queryKeys } from '@/config/query-keys'
import { keepPreviousData } from '@tanstack/react-query'

interface TimeRange {
  openTime: string
  closeTime: string
}

interface DaySchedule {
  isOpen: boolean
  timeRanges: TimeRange[]
}

interface BusinessHours {
  [key: string]: DaySchedule
}

async function fetchBusinessHours(branchId: string, dayOfWeek: string) {
  const supabase = createSupabaseClient()
  
  console.log('🔍 Consultando horarios para:', {
    sede: branchId,
    dia: dayOfWeek
  })

  const { data: branch, error } = await supabase
    .from('sedes')
    .select('opening_hours')
    .eq('id', branchId)
    .single()

  if (error) {
    console.error('❌ Error al obtener horarios:', error)
    throw error
  }

  if (!branch?.opening_hours) {
    console.error('❌ No hay horarios configurados para la sede')
    throw new Error('No hay horarios configurados para esta sede')
  }

  const hours = branch.opening_hours as BusinessHours
  console.log('📅 Horarios de la sede:', hours)

  const todaySchedule = hours[dayOfWeek]
  if (!todaySchedule) {
    console.error('❌ No se encontró configuración para el día:', dayOfWeek)
    console.log('Días disponibles:', Object.keys(hours))
    throw new Error(`No hay horarios configurados para ${dayOfWeek}`)
  }

  return todaySchedule
}

export function useBusinessHours(selectedDate?: Date) {
  const { currentBranch } = useBranches()
  const queryClient = useQueryClient()
  const currentDate = selectedDate || new Date()
  
  // Mapeo inverso de días en español a inglés
  const dayMap: { [key: string]: string } = {
    'lunes': 'monday',
    'martes': 'tuesday',
    'miércoles': 'wednesday',
    'jueves': 'thursday',
    'viernes': 'friday',
    'sábado': 'saturday',
    'domingo': 'sunday'
  }
  
  // Obtener el día en español y convertirlo a inglés
  const spanishDay = format(currentDate, 'EEEE', { locale: es }).toLowerCase()
  const dayOfWeek = dayMap[spanishDay]

  const timeToMinutes = useCallback((time: string) => {
    if (!time) return 0
    const [hours, minutes] = time.split(':').map(Number)
    return (hours * 60) + (minutes || 0)
  }, [])

  const minutesToTime = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }, [])

  const query = useQuery({
    queryKey: queryKeys.businessHours.byBranchAndDay(currentBranch?.id || '', dayOfWeek),
    queryFn: () => {
      if (!currentBranch?.id) throw new Error('No hay sede seleccionada')
      return fetchBusinessHours(currentBranch.id, dayOfWeek)
    },
    enabled: !!currentBranch?.id && !!dayOfWeek,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  })

  const businessHours = useMemo(() => {
    if (!query.data?.timeRanges?.length) {
      return null
    }

    let earliestMinutes = Number.MAX_SAFE_INTEGER
    let latestMinutes = 0

    query.data.timeRanges.forEach(range => {
      const startMinutes = timeToMinutes(range.openTime)
      const endMinutes = timeToMinutes(range.closeTime)
      
      earliestMinutes = Math.min(earliestMinutes, startMinutes)
      latestMinutes = Math.max(latestMinutes, endMinutes)
    })

    return {
      start: minutesToTime(earliestMinutes),
      end: minutesToTime(latestMinutes)
    }
  }, [query.data, timeToMinutes, minutesToTime])

  return {
    ...query,
    businessHours,
    isOpen: true,
    timeRanges: query.data?.timeRanges || [],
    isTimeInRange: useCallback((time: string) => {
      if (!query.data?.timeRanges?.length) return true
      const timeMinutes = timeToMinutes(time)
      return query.data.timeRanges.some(range => {
        const startMinutes = timeToMinutes(range.openTime)
        const endMinutes = timeToMinutes(range.closeTime)
        return timeMinutes >= startMinutes && timeMinutes < endMinutes
      })
    }, [query.data?.timeRanges, timeToMinutes])
  }
} 