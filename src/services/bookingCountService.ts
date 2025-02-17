import { createRedisClient } from '@/lib/redis'
import { subscriptionService } from './subscriptionService'
import { createSupabaseClient } from '@/lib/supabase'

const initRedis = createRedisClient()

export interface BookingCountResponse {
  currentCount: number
  limit: number
  remainingBookings: number
  resetTime: string
  isPro?: boolean
  nextResetDate?: string
}

interface CompanyPlanInfo {
  isPro: boolean
  limit: number
  planUpdatedAt: string
}

async function getCompanyPlanInfo(empresaId: string): Promise<CompanyPlanInfo> {
  const supabase = createSupabaseClient()
  
  try {
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('plan_id, plan_updated_at')
      .eq('id', empresaId)
      .single()

    if (empresaError) throw empresaError

    if (!empresa?.plan_id) {
      return {
        isPro: false,
        limit: 90,
        planUpdatedAt: new Date().toISOString()
      }
    }

    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('code, daily_booking_limit')
      .eq('id', empresa.plan_id)
      .single()

    if (planError) throw planError

    return {
      isPro: plan.code === 'PRO',
      limit: plan.daily_booking_limit,
      planUpdatedAt: empresa.plan_updated_at
    }
  } catch (error) {
    console.error('❌ Error obteniendo información del plan:', error)
    return {
      isPro: false,
      limit: 90,
      planUpdatedAt: new Date().toISOString()
    }
  }
}

function getNextResetDate(planUpdatedAt: string): Date {
  const updateDate = new Date(planUpdatedAt)
  const today = new Date()
  
  // Crear fecha de próximo reset manteniendo el día del plan_updated_at
  const nextReset = new Date(
    today.getFullYear(),
    today.getMonth(),
    updateDate.getDate(),
    23,
    59,
    59,
    999
  )
  
  // Si la fecha calculada ya pasó, avanzar al próximo mes
  if (nextReset <= today) {
    nextReset.setMonth(nextReset.getMonth() + 1)
  }
  
  return nextReset
}

function getCurrentPeriodStart(planUpdatedAt: string): Date {
  const updateDate = new Date(planUpdatedAt)
  const today = new Date()
  
  // Crear fecha de inicio del período actual
  return new Date(
    today.getFullYear(),
    today.getMonth(),
    updateDate.getDate(),
    0,
    0,
    0,
    0
  )
}

export const bookingCountService = {
  /**
   * Verifica si una empresa tiene plan PRO
   */
  async isPlanPro(empresaId: string): Promise<boolean> {
    const { isPro } = await getCompanyPlanInfo(empresaId)
    return isPro
  },

  /**
   * Genera la clave Redis para el conteo de reservas de una empresa
   */
  getBookingCountKey(empresaId: string, date: string): string {
    return `booking_count:${empresaId}:current`
  },

  /**
   * Obtiene el conteo actual de reservas para una empresa en una fecha específica
   */
  async initializeCount(empresaId: string, date: string): Promise<number> {
    console.log('📍 Initializing booking count from database:', { empresaId, date })
    
    try {
      // Verificar si es plan PRO primero
      const planInfo = await getCompanyPlanInfo(empresaId)
      if (planInfo.isPro) {
        console.log('ℹ️ Plan PRO detected, skipping count initialization')
        return 0
      }

      const [redis, supabase] = await Promise.all([
        initRedis,
        createSupabaseClient()
      ])

      // Obtener fechas del período actual
      const periodStart = getCurrentPeriodStart(planInfo.planUpdatedAt)
      const nextReset = getNextResetDate(planInfo.planUpdatedAt)

      // Obtener conteo de la base de datos para el período actual
      const { count, error: countError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresaId)
        .gte('date', periodStart.toISOString().split('T')[0])
        .lt('date', nextReset.toISOString().split('T')[0])
        .is('cancelled_at', null)

      if (countError) {
        throw new Error(`Error counting bookings: ${countError.message}`)
      }

      const bookingCount = count || 0
      console.log('✅ Database count:', { count: bookingCount })

      // Actualizar Redis de forma atómica
      const key = this.getBookingCountKey(empresaId, date)
      const multi = redis.multi()
      multi.set(key, bookingCount.toString())
      
      // Calcular tiempo hasta el próximo reset
      const secondsUntilReset = Math.floor((nextReset.getTime() - Date.now()) / 1000)
      multi.expire(key, secondsUntilReset)
      
      const results = await multi.exec()
      if (!results) {
        throw new Error('Failed to update Redis')
      }

      console.log('✅ Redis synchronized:', { key, value: bookingCount })
      return bookingCount

    } catch (error: any) {
      console.error('❌ Error initializing count:', error)
      throw error
    }
  },

  /**
   * Obtiene el estado actual del conteo de reservas para una empresa
   */
  async getBookingCountStatus(empresaId: string, date: string): Promise<BookingCountResponse> {
    console.log('📍 Getting booking count status:', { empresaId, date })
    
    try {
      // Obtener información del plan
      const planInfo = await getCompanyPlanInfo(empresaId)
      
      if (planInfo.isPro) {
        console.log('ℹ️ Plan PRO detected, returning unlimited status')
        return {
          currentCount: 0,
          limit: Number.MAX_SAFE_INTEGER,
          remainingBookings: Number.MAX_SAFE_INTEGER,
          resetTime: new Date().toISOString(),
          isPro: true
        }
      }

      // Calcular próximo reset basado en plan_updated_at
      const nextResetDate = getNextResetDate(planInfo.planUpdatedAt)
      
      // Si es FREE, obtener conteo actual
      const currentCount = await this.getCurrentCount(empresaId, date)
      const remainingBookings = Math.max(0, planInfo.limit - currentCount)

      console.log('✅ Booking count status:', { 
        currentCount, 
        limit: planInfo.limit, 
        remainingBookings,
        nextReset: nextResetDate
      })

      return {
        currentCount,
        limit: planInfo.limit,
        remainingBookings,
        resetTime: nextResetDate.toISOString(),
        isPro: false,
        nextResetDate: nextResetDate.toISOString()
      }
    } catch (error: any) {
      console.error('❌ Error getting booking status:', error)
      throw error
    }
  },

  async syncWithDatabase(empresaId: string, date: string): Promise<void> {
    console.log('🔄 Syncing with database:', { empresaId, date })
    await this.initializeCount(empresaId, date)
  },

  /**
   * Obtiene el conteo actual de reservas para una empresa en una fecha específica
   */
  async getCurrentCount(empresaId: string, date: string): Promise<number> {
    console.log('📍 Getting booking count:', { empresaId, date })
    
    try {
      // Verificar plan PRO primero
      const isPro = await this.isPlanPro(empresaId)
      if (isPro) {
        console.log('ℹ️ Plan PRO detected, skipping count')
        return 0
      }

      const redis = await initRedis
      const key = this.getBookingCountKey(empresaId, date)
      const count = await redis.get(key)
      
      if (count === null) {
        console.log('🔄 Count not found in Redis, initializing from database')
        return await this.initializeCount(empresaId, date)
      }

      const numericCount = Number(count)
      console.log('✅ Got booking count:', { key, count: numericCount })
      return numericCount
    } catch (error: any) {
      console.error('❌ Error getting booking count:', error)
      throw new Error(`Failed to get booking count: ${error.message}`)
    }
  },

  /**
   * Incrementa el conteo de reservas para una empresa
   */
  async incrementCount(empresaId: string, date: string): Promise<number> {
    console.log('📍 Incrementing booking count:', { empresaId, date })
    
    try {
      // Verificar plan PRO primero
      const isPro = await this.isPlanPro(empresaId)
      if (isPro) {
        console.log('ℹ️ Plan PRO detected, skipping increment')
        return 0
      }

      const redis = await initRedis
      const key = this.getBookingCountKey(empresaId, date)
      
      const multi = redis.multi()
      multi.incr(key)
      multi.expire(key, 24 * 60 * 60)
      
      const results = await multi.exec()
      if (!results || results.length === 0) {
        throw new Error('Multi execution failed')
      }
      
      const newCount = Number(results[0])
      console.log('✅ Booking count incremented:', { key, newCount })
      return newCount
    } catch (error: any) {
      console.error('❌ Error incrementing count:', error)
      throw new Error(`Failed to increment booking count: ${error.message}`)
    }
  },

  /**
   * Decrementa el conteo de reservas para una empresa
   */
  async decrementCount(empresaId: string, date: string): Promise<number> {
    console.log('📍 Decrementing booking count:', { empresaId, date })
    
    try {
      // Verificar plan PRO primero
      const isPro = await this.isPlanPro(empresaId)
      if (isPro) {
        console.log('ℹ️ Plan PRO detected, skipping decrement')
        return 0
      }

      const redis = await initRedis
      const key = this.getBookingCountKey(empresaId, date)
      const currentCount = await this.getCurrentCount(empresaId, date)
      
      if (currentCount <= 0) {
        console.log('ℹ️ Count already at 0, skipping decrement')
        return 0
      }
      
      const newCount = await redis.decr(key)
      console.log('✅ Booking count decremented:', { key, newCount })
      return newCount
    } catch (error: any) {
      console.error('❌ Error decrementing count:', error)
      throw new Error(`Failed to decrement booking count: ${error.message}`)
    }
  },

  /**
   * Establece el tiempo de expiración para el contador
   */
  async setExpiration(empresaId: string, date: string, expirationHours: number = 24): Promise<void> {
    const key = this.getBookingCountKey(empresaId, date)
    const redis = await initRedis
    await redis.expire(key, expirationHours * 60 * 60) // Convertir horas a segundos
  },

  /**
   * Verifica si una empresa puede realizar más reservas
   */
  async canMakeBooking(empresaId: string, date: string): Promise<boolean> {
    console.log('📍 Checking if can make booking:', { empresaId, date })
    
    try {
      // Verificar plan PRO primero
      const isPro = await this.isPlanPro(empresaId)
      if (isPro) {
        console.log('ℹ️ Plan PRO detected, booking allowed')
        return true
      }

      const status = await this.getBookingCountStatus(empresaId, date)
      const canBook = status.remainingBookings > 0
      console.log('✅ Can make booking:', { canBook, remainingBookings: status.remainingBookings })
      return canBook
    } catch (error: any) {
      console.error('❌ Error checking booking availability:', error)
      throw new Error(`Failed to check booking availability: ${error.message}`)
    }
  },

  /**
   * Resetea el contador de reservas para una empresa
   */
  async resetCount(empresaId: string, date: string): Promise<void> {
    console.log('📍 Resetting booking count:', { empresaId, date })
    
    try {
      // Verificar plan PRO primero
      const isPro = await this.isPlanPro(empresaId)
      if (isPro) {
        console.log('ℹ️ Plan PRO detected, skipping reset')
        return
      }

      const key = this.getBookingCountKey(empresaId, date)
      const redis = await initRedis
      await redis.del(key)
      console.log('✅ Booking count reset successfully')
    } catch (error: any) {
      console.error('❌ Error resetting count:', error)
      throw new Error(`Failed to reset booking count: ${error.message}`)
    }
  }
} 