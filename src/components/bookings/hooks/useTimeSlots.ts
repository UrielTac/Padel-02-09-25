import { useState, useEffect, useCallback } from 'react'
import { useBusinessHours } from '@/hooks/useBusinessHours'

interface TimeSlot {
  hour: string
  subSlots: {
    time: string
    minutes: number
    isAvailable: boolean
  }[]
}

interface UseTimeSlotsProps {
  selectedDate: Date
}

export function useTimeSlots({ selectedDate }: UseTimeSlotsProps) {
  const { businessHours, isOpen, isTimeInRange } = useBusinessHours(selectedDate)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])

  // Función para generar slots de tiempo
  const generateTimeSlots = useCallback(() => {
    if (!businessHours?.start || !businessHours?.end) {
      console.log('⚠️ No hay horarios definidos')
      return []
    }

    console.log('📍 Generando slots para horario:', businessHours)
    
    const slots: TimeSlot[] = []
    const [startHour] = businessHours.start.split(':').map(Number)
    const [endHour] = businessHours.end.split(':').map(Number)
    const TIME_INTERVAL = 15

    for (let hour = startHour; hour <= endHour; hour++) {
      const hourString = `${hour.toString().padStart(2, '0')}:00`
      const subSlots = []

      for (let minutes = 0; minutes < 60; minutes += TIME_INTERVAL) {
        const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        subSlots.push({
          time,
          minutes: hour * 60 + minutes,
          isAvailable: isTimeInRange(time)
        })
      }

      if (subSlots.length > 0) {
        slots.push({
          hour: hourString,
          subSlots
        })
      }
    }

    return slots
  }, [businessHours, isTimeInRange])

  // Actualizar slots cuando cambien los horarios o la fecha
  useEffect(() => {
    const newSlots = generateTimeSlots()
    if (JSON.stringify(newSlots) !== JSON.stringify(timeSlots)) {
      console.log('🔄 Actualizando slots por cambio significativo')
      setTimeSlots(newSlots)
    }
  }, [generateTimeSlots, timeSlots])

  return {
    timeSlots,
    isOpen
  }
} 