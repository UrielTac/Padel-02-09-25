import { createSupabaseClient } from '@/lib/supabase'
import { type SelectedBooking, type PaymentStatusEnum, type PaymentTypeEnum, type PaymentMethodEnum } from '@/types/bookings'

interface ServiceResponse<T> {
  data?: T
  error?: {
    message: string
    code: string
    details?: string
  }
}

interface RentalItemDB {
  id: string
  item_id: string
  quantity: number
  price_per_unit: number
  items?: {
    name: string
  }
}

// Tipos para las respuestas de Supabase
interface BookingDB {
  id: string
  court_id: string
  date: string
  start_time: string
  end_time: string
  total_price: number
  deposit_amount: number
  court_price: number
  rental_items_price: number
  payment_status: PaymentStatusEnum
  payment_method: PaymentMethodEnum
  payment_type: PaymentTypeEnum
  title: string
  description: string | null
  courts?: CourtDB | null
  booking_participants?: ParticipantDB[]
  booking_rentals?: RentalItemDB[]
}

interface CourtDB {
  id: string
  name: string
  branch_id: string
}

interface ParticipantDB {
  id: string
  user_id: string
  role: string
  usuarios?: {
    nombre: string | null
  } | null
}

// Crear una instancia de Supabase memoizada
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

const getSupabaseInstance = () => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient()
  }
  return supabaseInstance
}

// Funciones helper para transformación de datos
const transformParticipant = (participant: ParticipantDB) => {
  const [firstName = '', lastName = ''] = participant.usuarios?.nombre?.split(' ') || ['', '']
  return {
    id: participant.id,
    memberId: participant.user_id,
    role: participant.role,
    firstName,
    lastName
  }
}

const transformRentalItem = (rental: RentalItemDB) => ({
  id: rental.item_id,
  name: rental.items?.name || 'Item sin nombre',
  quantity: rental.quantity,
  pricePerUnit: rental.price_per_unit
})

const transformBooking = (booking: unknown): SelectedBooking => {
  const bookingData = booking as BookingDB
  const participants = bookingData.booking_participants?.map(transformParticipant) || []
  const rentedItems = bookingData.booking_rentals?.map(transformRentalItem) || []

  return {
    id: bookingData.id,
    courtId: bookingData.court_id,
    court: bookingData.courts?.name || '',
    date: bookingData.date,
    startTime: bookingData.start_time,
    endTime: bookingData.end_time,
    totalAmount: bookingData.total_price || 0,
    depositAmount: bookingData.deposit_amount || 0,
    courtPrice: bookingData.court_price || 0,
    rentalItemsPrice: bookingData.rental_items_price || 0,
    paymentStatus: bookingData.payment_status,
    paymentMethod: bookingData.payment_method,
    paymentType: bookingData.payment_type,
    title: bookingData.title || '',
    description: bookingData.description || '',
    participants,
    rentedItems
  }
}

export const bookingQueryService = {
  async getBookingById(id: string): Promise<SelectedBooking> {
    try {
      console.log('🔍 BookingQueryService - Consultando reserva:', { 
        id,
        timestamp: new Date().toISOString()
      })
      
      const supabase = getSupabaseInstance()
      
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          id,
          court_id,
          date,
          start_time,
          end_time,
          total_price,
          deposit_amount,
          court_price,
          rental_items_price,
          payment_status,
          payment_method,
          payment_type,
          title,
          description,
          courts (
            id,
            name,
            branch_id
          ),
          booking_participants (
            id,
            user_id,
            role,
            usuarios (
              nombre
            )
          ),
          booking_rentals (
            id,
            item_id,
            quantity,
            price_per_unit,
            items (
              name
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!booking) throw new Error('Reserva no encontrada')

      const transformedBooking = transformBooking(booking)

      console.log('✅ Datos transformados:', {
        id: transformedBooking.id,
        paymentType: transformedBooking.paymentType,
        isGuarantee: transformedBooking.paymentType === 'guarantee'
      })

      return transformedBooking
    } catch (error) {
      console.error('❌ Error en getBookingById:', error)
      throw error
    }
  },

  async getBookingsByDate(date: string, branchId?: string): Promise<SelectedBooking[]> {
    try {
      console.log('🔍 BookingQueryService - Consultando reservas para fecha:', {
        date,
        branchId,
        timestamp: new Date().toISOString()
      })

      const supabase = getSupabaseInstance()
      let query = supabase
        .from('bookings')
        .select(`
          id,
          court_id,
          date,
          start_time,
          end_time,
          total_price,
          deposit_amount,
          court_price,
          rental_items_price,
          payment_status,
          payment_method,
          payment_type,
          title,
          description,
          courts (
            id,
            name,
            branch_id
          ),
          booking_participants (
            id,
            user_id,
            role,
            usuarios (
              nombre
            )
          ),
          booking_rentals (
            id,
            item_id,
            quantity,
            price_per_unit,
            items (
              name
            )
          )
        `)
        .eq('date', date)
        .or('payment_status.neq.cancelled,payment_status.is.null')

      // Aplicar filtro de sucursal a nivel de base de datos
      if (branchId) {
        query = query.eq('courts.branch_id', branchId)
      }

      const { data: bookings, error } = await query

      if (error) throw error
      if (!bookings) return []

      // Transformar los datos
      const transformedBookings = bookings.map(booking => transformBooking(booking))

      console.log('✅ Datos transformados:', {
        total: transformedBookings.length,
        sample: transformedBookings[0],
        payment_types: transformedBookings.map(b => ({
          id: b.id,
          paymentType: b.paymentType,
          paymentStatus: b.paymentStatus
        }))
      })

      return transformedBookings
    } catch (error) {
      console.error('❌ Error en getBookingsByDate:', error)
      throw error
    }
  },

  async registerPayment(params: {
    bookingId: string
    depositAmount: number
    paymentMethod: PaymentMethodEnum
    notes?: string
  }): Promise<ServiceResponse<any>> {
    try {
      console.log('💰 Registrando pago:', {
        ...params,
        timestamp: new Date().toISOString()
      })

      const supabase = getSupabaseInstance()
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'completed' as const,
          payment_method: params.paymentMethod,
          deposit_amount: params.depositAmount,
          payment_notes: params.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.bookingId)
        .select()
        .single()

      if (fetchError) {
        console.error('❌ Error al registrar pago:', fetchError)
        return {
          error: {
            message: 'Error al registrar el pago',
            code: 'DB_ERROR',
            details: fetchError.message
          }
        }
      }

      console.log('✅ Pago registrado exitosamente:', booking)
      return { data: booking }
    } catch (error: any) {
      console.error('❌ Error general al registrar pago:', error)
      return {
        error: {
          message: 'Error inesperado al registrar el pago',
          code: 'UNEXPECTED_ERROR',
          details: error.message
        }
      }
    }
  },

  async cancelBooking(bookingId: string, reason?: string): Promise<ServiceResponse<any>> {
    try {
      console.log('🔄 Cancelando reserva:', {
        bookingId,
        reason,
        timestamp: new Date().toISOString()
      })

      const supabase = getSupabaseInstance()
      
      // Primero, obtenemos el estado actual de la reserva
      const { data: currentBooking, error: fetchError } = await supabase
        .from('bookings')
        .select('payment_status, total_price, deposit_amount')
        .eq('id', bookingId)
        .single()

      if (fetchError) {
        console.error('❌ Error al obtener la reserva:', fetchError)
        return {
          error: {
            message: 'Error al obtener la reserva',
            code: 'DB_ERROR',
            details: fetchError.message
          }
        }
      }

      // Actualizamos el estado basado en el pago actual
      const depositAmount = currentBooking?.deposit_amount || 0
      const newStatus = depositAmount > 0 ? 'partial' : 'pending'
      
      const { data: booking, error: updateError } = await supabase
        .from('bookings')
        .update({
          payment_status: newStatus,
          cancellation_reason: reason || null,
          cancelled_at: new Date().toISOString(),
          is_cancelled: true // Campo adicional para tracking
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error al cancelar reserva:', updateError)
        return {
          error: {
            message: 'Error al cancelar la reserva',
            code: 'DB_ERROR',
            details: updateError.message
          }
        }
      }

      console.log('✅ Reserva cancelada exitosamente:', booking)
      return { data: booking }
    } catch (error: any) {
      console.error('❌ Error general al cancelar reserva:', error)
      return {
        error: {
          message: 'Error inesperado al cancelar la reserva',
          code: 'UNEXPECTED_ERROR',
          details: error.message
        }
      }
    }
  }
} 