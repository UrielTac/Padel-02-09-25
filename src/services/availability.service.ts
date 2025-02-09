import { createClient } from '@supabase/supabase-js';
import { format, addMinutes, parseISO, isWithinInterval } from 'date-fns';
import { 
  AvailabilityParams, 
  AvailabilitySlot, 
  TimeRange, 
  HoldReservation,
  OpeningHours,
  DaySchedule
} from '@/types/availability';
import { TIME_SLOTS, TIME_RANGES, HOLD_DURATION } from '@/config/availability';

// Inicializar cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TimeSlot {
  start: string;
  end: string;
  isAvailable: boolean;
  price: number;
}

interface CustomTimeRange {
  startTime: string;
  endTime: string;
  percentage: number;
}

class AvailabilityService {
  private static instance: AvailabilityService;
  private holdReservations: Map<string, HoldReservation> = new Map();

  private constructor() {
    setInterval(() => this.cleanupExpiredHolds(), 60000);
  }

  public static getInstance(): AvailabilityService {
    if (!AvailabilityService.instance) {
      AvailabilityService.instance = new AvailabilityService();
    }
    return AvailabilityService.instance;
  }

  private generateSlotId(courtId: string, date: string, startTime: string): string {
    return `${courtId}-${date}-${startTime}`;
  }

  private async getCourts(params?: { courtType?: string, branchId: string }) {
    console.log('AvailabilityService - getCourts - params:', params);
    const query = supabase.from('courts')
      .select('*')
      .eq('is_active', true)
      .eq('branch_id', params?.branchId);
    
    if (params?.courtType) {
      query.eq('court_type', params.courtType);
    }

    const { data: courts, error } = await query;
    console.log('AvailabilityService - getCourts - resultado:', { courts, error });
    
    if (error) throw error;
    return courts;
  }

  private async getBookings(date: Date, courtIds: string[]) {
    console.log('AvailabilityService - getBookings - params:', { date, courtIds });
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', format(date, 'yyyy-MM-dd'))
      .in('court_id', courtIds)
      .neq('payment_status', 'cancelled');

    console.log('AvailabilityService - getBookings - resultado:', { bookings, error });
    if (error) throw error;
    return bookings;
  }

  private isTimeSlotAvailable(
    startTime: string,
    endTime: string,
    bookings: any[],
    date: Date,
    courtId: string
  ): boolean {
    const slotStartMinutes = this.timeToMinutes(startTime);
    const slotEndMinutes = this.timeToMinutes(endTime);

    // Filtrar reservas del mismo día y pista
    const relevantBookings = bookings.filter(booking => 
      booking.court_id === courtId && 
      booking.date === format(date, 'yyyy-MM-dd')
    );

    // Verificar si el slot se solapa con alguna reserva
    const hasOverlap = relevantBookings.some(booking => {
      const bookingStartMinutes = this.timeToMinutes(booking.start_time);
      const bookingEndMinutes = this.timeToMinutes(booking.end_time);

      // Un slot está disponible si:
      // 1. Termina antes o en el inicio de la reserva, o
      // 2. Comienza después o en el final de la reserva
      const overlaps = !(
        slotEndMinutes <= bookingStartMinutes ||
        slotStartMinutes >= bookingEndMinutes
      );

      if (overlaps) {
        console.log('AvailabilityService - Solapamiento detectado:', {
          slot: { start: startTime, end: endTime },
          booking: { start: booking.start_time, end: booking.end_time }
        });
      }

      return overlaps;
    });

    return !hasOverlap;
  }

  private calculatePrice(court: any, durationInMinutes: number, startTime: string, date: Date): number | null {
    // Obtener precio base
    const durationPricing = court.duration_pricing;
    if (!durationPricing) return null;

    let basePrice = durationPricing[durationInMinutes.toString()];
    if (!basePrice) return null;

    // Verificar precios personalizados
    if (court.custom_pricing) {
      const dayOfWeek = format(date, 'i'); // Obtiene número de día (1-7, donde 1 es lunes)
      const customPricing = court.custom_pricing[dayOfWeek];

      if (customPricing?.isSelected && customPricing.timeRanges) {
        // Convertir hora de inicio a minutos para comparación
        const startMinutes = this.timeToMinutes(startTime);

        // Buscar si el horario cae en algún rango personalizado
        const matchingRange = customPricing.timeRanges.find((range: CustomTimeRange) => {
          const rangeStartMinutes = this.timeToMinutes(range.startTime);
          const rangeEndMinutes = this.timeToMinutes(range.endTime);
          return startMinutes >= rangeStartMinutes && startMinutes < rangeEndMinutes;
        });

        // Aplicar porcentaje si encontramos un rango que coincida
        if (matchingRange) {
          const adjustment = basePrice * (matchingRange.percentage / 100);
          basePrice += adjustment;
        }
      }
    }

    console.log('AvailabilityService - Calculando precio:', {
      courtName: court.name,
      durationInMinutes,
      basePrice,
      date: format(date, 'yyyy-MM-dd'),
      startTime,
      customPricing: court.custom_pricing
    });

    return basePrice;
  }

  private determineStatus(
    timeSlot: string,
    bookings: any[],
    date: Date
  ): 'available' | 'popular' | 'lastCall' {
    const hour = parseInt(timeSlot.split(':')[0]);
    
    if (hour >= 17 && hour <= 20) return 'popular';
    if (hour >= 21) return 'lastCall';
    return 'available';
  }

  private async getBranchSchedule(branchId: string, date: Date): Promise<DaySchedule | null> {
    console.log('AvailabilityService - getBranchSchedule:', { branchId, date });
    
    try {
      const { data: branch, error } = await supabase
        .from('sedes')
        .select('opening_hours, settings')
        .eq('id', branchId)
        .single();

      if (error) throw error;
      if (!branch?.opening_hours) return null;

      const dayOfWeek = format(date, 'EEEE').toLowerCase();
      const schedule = branch.opening_hours[dayOfWeek as keyof OpeningHours];

      console.log('AvailabilityService - Horarios obtenidos:', {
        dayOfWeek,
        schedule
      });

      return schedule || null;
    } catch (error) {
      console.error('Error al obtener horarios de la sede:', error);
      return null;
    }
  }

  private findAvailableRanges(
    timeRanges: { openTime: string; closeTime: string; }[],
    courtBookings: any[],
    date: Date
  ): Array<{ start: string; end: string; }> {
    const ranges: Array<{ start: string; end: string; }> = [];
    
    // Filtrar y ordenar reservas una sola vez
    const sortedBookings = courtBookings
      .filter(booking => booking.date === format(date, 'yyyy-MM-dd'))
      .sort((a, b) => this.timeToMinutes(a.start_time) - this.timeToMinutes(b.start_time));

    timeRanges.forEach(range => {
      const rangeStartMinutes = this.timeToMinutes(range.openTime);
      const rangeEndMinutes = this.timeToMinutes(range.closeTime);

      // Si no hay reservas, agregar el rango completo
      if (sortedBookings.length === 0) {
        ranges.push({ start: range.openTime, end: range.closeTime });
        return;
      }

      let currentStartMinutes = rangeStartMinutes;

      // Procesar cada reserva
      for (let i = 0; i < sortedBookings.length; i++) {
        const booking = sortedBookings[i];
        const bookingStartMinutes = this.timeToMinutes(booking.start_time);
        const bookingEndMinutes = this.timeToMinutes(booking.end_time);

        // Agregar rango antes de la reserva si hay espacio
        if (currentStartMinutes < bookingStartMinutes) {
          const rangeSize = bookingStartMinutes - currentStartMinutes;
          console.log(`AvailabilityService - Evaluando rango antes de reserva:`, {
            start: this.minutesToTime(currentStartMinutes),
            end: booking.start_time,
            size: rangeSize
          });
          
          ranges.push({
            start: this.minutesToTime(currentStartMinutes),
            end: booking.start_time
          });
        }

        currentStartMinutes = bookingEndMinutes;

        // Procesar espacio entre reservas
        if (i < sortedBookings.length - 1) {
          const nextBooking = sortedBookings[i + 1];
          const nextBookingStartMinutes = this.timeToMinutes(nextBooking.start_time);
          
          if (bookingEndMinutes < nextBookingStartMinutes) {
            const gapSize = nextBookingStartMinutes - bookingEndMinutes;
            console.log(`AvailabilityService - Evaluando espacio entre reservas:`, {
              start: booking.end_time,
              end: nextBooking.start_time,
              size: gapSize
            });
            
          ranges.push({
              start: booking.end_time,
              end: nextBooking.start_time
            });
          }
        }
      }

      // Agregar rango final si hay espacio después de la última reserva
      if (currentStartMinutes < rangeEndMinutes) {
        const finalRangeSize = rangeEndMinutes - currentStartMinutes;
        console.log(`AvailabilityService - Evaluando rango final:`, {
          start: this.minutesToTime(currentStartMinutes),
          end: range.closeTime,
          size: finalRangeSize
        });
        
        ranges.push({
          start: this.minutesToTime(currentStartMinutes),
          end: range.closeTime
        });
      }
    });

    // Filtrar rangos demasiado cortos y fusionar rangos solapados
    const filteredRanges = ranges.filter(range => {
      const duration = this.timeToMinutes(range.end) - this.timeToMinutes(range.start);
      return duration >= 30;
    });

    console.log(`AvailabilityService - Rangos disponibles después de filtrado:`, {
      totalRanges: filteredRanges.length,
      ranges: filteredRanges
    });

    return this.mergeOverlappingRanges(filteredRanges);
  }

  private generateTimeSlots(
    timeRanges: { openTime: string; closeTime: string; }[], 
    durationInHours: number,
    court: any,
    bookings: any[] = [],
    date: Date
  ): TimeSlot[] {
    // La duración ya viene en minutos, no necesitamos multiplicar por 60
    const durationInMinutes = Math.round(durationInHours);
    
    // Verificar si la duración está disponible con una tolerancia de 1 minuto
    const isDurationAvailable = court.available_durations?.some(
      (duration: number) => Math.abs(duration - durationInMinutes) <= 1
    );

    if (!isDurationAvailable) {
      console.log(`AvailabilityService - Duración ${durationInMinutes}min no disponible para ${court.name}`, {
        availableDurations: court.available_durations,
        requestedDuration: durationInMinutes,
        courtName: court.name
      });
      return [];
    }

    const slots: TimeSlot[] = [];
    const SLOT_INTERVAL = 30;

    // Filtrar reservas una sola vez
    const filteredBookings = bookings.filter(booking => 
      booking.court_id === court.id && 
      booking.date === format(date, 'yyyy-MM-dd')
    );

    // Obtener rangos disponibles
    const availableRanges = this.findAvailableRanges(timeRanges, filteredBookings, date);

    console.log(`AvailabilityService - Rangos disponibles para ${court.name}:`, {
      ranges: availableRanges,
      durationInMinutes,
      courtName: court.name
    });

    // Generar slots para cada rango disponible
    availableRanges.forEach(range => {
      const startMinutes = this.timeToMinutes(range.start);
      const endMinutes = this.timeToMinutes(range.end);
      
      // Verificación más precisa del tamaño del rango
      const rangeSize = endMinutes - startMinutes;
      if (rangeSize < durationInMinutes) {
        console.log(`AvailabilityService - Rango demasiado pequeño:`, {
          range,
          rangeSize,
          durationInMinutes
        });
        return;
      }

      // Generar slots con verificación de solapamiento
      for (let currentMinutes = startMinutes; currentMinutes + durationInMinutes <= endMinutes; currentMinutes += SLOT_INTERVAL) {
        const slotEndMinutes = currentMinutes + durationInMinutes;
        const startTime = this.minutesToTime(currentMinutes);
        const endTime = this.minutesToTime(slotEndMinutes);

        // Verificar disponibilidad del slot
        const isAvailable = this.isTimeSlotAvailable(startTime, endTime, filteredBookings, date, court.id);
        
        if (isAvailable) {
          const price = this.calculatePrice(court, durationInMinutes, startTime, date);
          
          console.log(`AvailabilityService - Slot válido encontrado:`, {
            start: startTime,
            end: endTime,
            court: court.name,
            price
          });
          
          slots.push({
            start: startTime,
            end: endTime,
            isAvailable: true,
            price: price || 0
          });
        }
      }
    });

    console.log(`AvailabilityService - Total slots generados para ${court.name}:`, {
      totalSlots: slots.length,
      durationInMinutes
    });

    return slots;
  }

  private mergeOverlappingRanges(
    ranges: Array<{ start: string; end: string; }>
  ): Array<{ start: string; end: string; }> {
    if (ranges.length <= 1) return ranges;

    // Ordenar rangos por tiempo de inicio
    const sortedRanges = [...ranges].sort((a, b) => 
      this.timeToMinutes(a.start) - this.timeToMinutes(b.start)
    );

    const mergedRanges: Array<{ start: string; end: string; }> = [sortedRanges[0]];

    for (let i = 1; i < sortedRanges.length; i++) {
      const currentRange = sortedRanges[i];
      const lastMergedRange = mergedRanges[mergedRanges.length - 1];

      // Si hay solapamiento, extender el último rango
      if (this.timeToMinutes(currentRange.start) <= this.timeToMinutes(lastMergedRange.end)) {
        if (this.timeToMinutes(currentRange.end) > this.timeToMinutes(lastMergedRange.end)) {
          lastMergedRange.end = currentRange.end;
        }
      } else {
        // Si no hay solapamiento, agregar nuevo rango
        mergedRanges.push(currentRange);
      }
    }

    return mergedRanges;
  }

  private findAvailableGaps(
    rangeStartMinutes: number,
    rangeEndMinutes: number,
    bookings: any[],
    date: Date
  ): Array<{start: number, end: number}> {
    // Ordenar las reservas por hora de inicio
    const sortedBookings = [...bookings]
      .filter(booking => booking.date === format(date, 'yyyy-MM-dd'))
      .sort((a, b) => {
        const aStart = this.timeToMinutes(a.start_time);
        const bStart = this.timeToMinutes(b.start_time);
        return aStart - bStart;
      });

    const gaps: Array<{start: number, end: number}> = [];
    let currentStart = rangeStartMinutes;

    // Procesar cada reserva para encontrar gaps
    sortedBookings.forEach(booking => {
      const bookingStart = this.timeToMinutes(booking.start_time);
      const bookingEnd = this.timeToMinutes(booking.end_time);

      // Si hay espacio antes de la reserva, agregar gap
      if (currentStart < bookingStart) {
        gaps.push({
          start: currentStart,
          end: bookingStart
        });
      }

      currentStart = bookingEnd;
    });

    // Agregar el último gap si queda espacio
    if (currentStart < rangeEndMinutes) {
      gaps.push({
        start: currentStart,
        end: rangeEndMinutes
      });
    }

    return gaps;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private canCreateSlot(start: string, end: string, durationInMinutes: number): boolean {
    const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
    return (endMinutes - startMinutes) >= durationInMinutes;
  }

  public async findAvailableSlots(params: AvailabilityParams): Promise<AvailabilitySlot[]> {
    console.log('AvailabilityService - findAvailableSlots - params:', params);
    try {
      const schedule = await this.getBranchSchedule(params.branchId, params.date);
      
      if (!schedule || !schedule.isOpen) {
        console.log('AvailabilityService - Sede cerrada en la fecha seleccionada');
        return [];
      }

      const courts = await this.getCourts({ 
        courtType: params.courtType,
        branchId: params.branchId
      });
      
      if (!courts.length) return [];

      const courtIds = courts.map(court => court.id);
      const bookings = await this.getBookings(params.date, courtIds);
      const availableSlots: AvailabilitySlot[] = [];

      // Procesar cada pista por separado
      for (const court of courts) {
        // Convertir duración de horas a minutos
        const durationInMinutes = params.duration * 60;
        const slots = this.generateTimeSlots(schedule.timeRanges, durationInMinutes, court, bookings, params.date);
        console.log(`AvailabilityService - Slots generados para ${court.name}:`, slots);

        // Procesar cada slot generado para esta pista
        for (const timeSlot of slots) {
          if (this.isTimeSlotAvailable(timeSlot.start, timeSlot.end, bookings, params.date, court.id)) {
            const slotId = this.generateSlotId(court.id, format(params.date, 'yyyy-MM-dd'), timeSlot.start);
            
            const hold = this.holdReservations.get(slotId);
            if (hold) {
              continue;
            }

            const price = this.calculatePrice(court, durationInMinutes, timeSlot.start, params.date);

            console.log(`AvailabilityService - Agregando slot con precio:`, {
              court: court.name,
              start: timeSlot.start,
              end: timeSlot.end,
              price,
              durationInMinutes
            });

            availableSlots.push({
              id: slotId,
              startTime: timeSlot.start,
              endTime: timeSlot.end,
              courtId: court.id,
              courtName: court.name,
              courtType: court.court_type,
              price: price || 0,
              status: this.determineStatus(timeSlot.start, bookings, params.date)
            });
          }
        }
      }

      if (params.timeOfDay) {
        console.log('AvailabilityService - Aplicando filtro por momento del día:', params.timeOfDay);
        return this.filterByTimeOfDay(availableSlots, params.timeOfDay);
      }

      console.log('AvailabilityService - findAvailableSlots - slots encontrados:', {
        total: availableSlots.length,
        slotsConPrecios: availableSlots.map(slot => ({
          court: slot.courtName,
          time: `${slot.startTime}-${slot.endTime}`,
          price: slot.price
        }))
      });
      
      return availableSlots;

    } catch (error) {
      console.error('AvailabilityService - Error finding available slots:', error);
      throw error;
    }
  }

  private filterByTimeOfDay(slots: AvailabilitySlot[], timeOfDay: string): AvailabilitySlot[] {
    const range = TIME_RANGES[timeOfDay as keyof typeof TIME_RANGES];
    
    return slots.filter(slot => {
      const slotTime = slot.startTime;
      return slotTime >= range.start && slotTime <= range.end;
    });
  }

  public async holdSlot(slotId: string, courtId: string, date: Date, timeRange: TimeRange): Promise<boolean> {
    if (this.holdReservations.has(slotId)) {
      return false;
    }

    const hold: HoldReservation = {
      slotId,
      courtId,
      date,
      timeRange,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + HOLD_DURATION)
    };

    this.holdReservations.set(slotId, hold);
    return true;
  }

  public releaseHold(slotId: string): void {
    this.holdReservations.delete(slotId);
  }

  private cleanupExpiredHolds(): void {
    const now = new Date();
    Array.from(this.holdReservations.entries()).forEach(([slotId, hold]) => {
      if (hold.expiresAt <= now) {
        this.holdReservations.delete(slotId);
      }
    });
  }

  public subscribeToChanges(date: string, callback: (payload: any) => void) {
    return supabase
      .channel('bookings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `date=eq.${date}`
        },
        callback
      )
      .subscribe();
  }
}

export default AvailabilityService.getInstance(); 