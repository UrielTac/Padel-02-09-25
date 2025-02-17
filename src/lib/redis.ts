import { createClient } from 'redis'
import type { RedisClientType } from 'redis'

let redisClient: RedisClientType | null = null

export async function createRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    try {
      console.log('🔄 Initializing Redis client...')
      
      const redisUrl = process.env.REDIS_URL
      if (!redisUrl) {
        throw new Error('REDIS_URL environment variable is not defined')
      }

      redisClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            console.log(`Reconnection attempt ${retries}`)
            if (retries > 3) {
              console.error('❌ Max reconnection attempts reached')
              return new Error('Max reconnection attempts reached')
            }
            return Math.min(retries * 1000, 3000)
          }
        }
      })

      // Manejar eventos de conexión
      redisClient.on('error', (err) => {
        console.error('❌ Redis Client Error:', err)
      })

      redisClient.on('connect', () => {
        console.log('✅ Redis Client Connected')
      })

      redisClient.on('reconnecting', () => {
        console.log('🔄 Redis Client Reconnecting...')
      })

      // Conectar al cliente
      await redisClient.connect()

      // Test connection
      await redisClient.set('test-connection', 'ok', {
        EX: 10
      })
      
      const testValue = await redisClient.get('test-connection')
      console.log('📄 Test connection value:', testValue)
      
      if (testValue !== 'ok') {
        throw new Error('Redis test connection failed: value mismatch')
      }

      await redisClient.del('test-connection')
      console.log('✅ Redis connection test successful')

    } catch (error: any) {
      console.error('❌ Failed to create Redis client:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
      redisClient = null
      throw error
    }
  }

  if (!redisClient) {
    throw new Error('Failed to initialize Redis client')
  }

  return redisClient
}

// Utility functions for booking counts
export const bookingCounters = {
  getKey(empresaId: string, date: string, planUpdatedAt: string): string {
    const planDate = new Date(planUpdatedAt)
    const currentDate = new Date(date)
    
    // Calcular el período actual basado en plan_updated_at
    const monthsSincePlanStart = 
      (currentDate.getFullYear() - planDate.getFullYear()) * 12 +
      (currentDate.getMonth() - planDate.getMonth())
    
    // Usar el día del plan_updated_at como referencia
    const periodStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      planDate.getDate()
    )
    
    // Si estamos antes del día de reset en el mes actual, usar el período anterior
    if (currentDate.getDate() < planDate.getDate()) {
      periodStart.setMonth(periodStart.getMonth() - 1)
    }
    
    return `booking_count:${empresaId}:${periodStart.toISOString().split('T')[0]}`
  },

  async increment(empresaId: string, date: string, planUpdatedAt: string): Promise<number> {
    console.log('📍 Incrementing booking count:', { empresaId, date, planUpdatedAt })
    try {
      const redis = await createRedisClient()
      const key = this.getKey(empresaId, date, planUpdatedAt)
      
      // Calcular la fecha de fin del período actual
      const planDate = new Date(planUpdatedAt)
      const currentDate = new Date(date)
      const nextResetDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        planDate.getDate(),
        23,
        59,
        59
      )
      
      // Si estamos después del día de reset, avanzar al próximo mes
      if (currentDate.getDate() >= planDate.getDate()) {
        nextResetDate.setMonth(nextResetDate.getMonth() + 1)
      }
      
      // Calcular segundos hasta el próximo reset
      const secondsUntilReset = Math.floor((nextResetDate.getTime() - currentDate.getTime()) / 1000)
      
      const multi = redis.multi()
      multi.incr(key)
      multi.expire(key, secondsUntilReset)
      
      const results = await multi.exec()
      if (!results || results.length === 0) {
        throw new Error('Multi execution failed')
      }
      
      const count = Number(results[0])
      console.log('✅ Booking count incremented:', { key, count, nextReset: nextResetDate })
      return count
    } catch (error: any) {
      console.error('❌ Error incrementing booking count:', error)
      throw new Error(`Failed to increment booking count: ${error.message}`)
    }
  },

  async get(empresaId: string, date: string, planUpdatedAt: string): Promise<number> {
    console.log('📍 Getting booking count:', { empresaId, date, planUpdatedAt })
    try {
      const redis = await createRedisClient()
      const key = this.getKey(empresaId, date, planUpdatedAt)
      const count = await redis.get(key)
      const numericCount = count ? Number(count) : 0
      console.log('✅ Got booking count:', { key, count: numericCount })
      return numericCount
    } catch (error: any) {
      console.error('❌ Error getting booking count:', error)
      throw new Error(`Failed to get booking count: ${error.message}`)
    }
  },

  async reset(empresaId: string, date: string, planUpdatedAt: string): Promise<void> {
    console.log('📍 Resetting booking count:', { empresaId, date, planUpdatedAt })
    try {
      const redis = await createRedisClient()
      const key = this.getKey(empresaId, date, planUpdatedAt)
      await redis.del(key)
      console.log('✅ Booking count reset:', { key })
    } catch (error: any) {
      console.error('❌ Error resetting booking count:', error)
      throw new Error(`Failed to reset booking count: ${error.message}`)
    }
  },

  async getMultiple(empresaId: string, dates: string[], planUpdatedAt: string): Promise<Record<string, number>> {
    console.log('📍 Getting multiple booking counts:', { empresaId, dates, planUpdatedAt })
    try {
      const redis = await createRedisClient()
      const multi = redis.multi()
      
      const keys = dates.map(date => this.getKey(empresaId, date, planUpdatedAt))
      keys.forEach(key => multi.get(key))
      
      const results = await multi.exec()
      
      const counts: Record<string, number> = {}
      dates.forEach((date, index) => {
        counts[date] = results?.[index] ? Number(results[index]) : 0
      })
      
      console.log('✅ Got multiple booking counts:', counts)
      return counts
    } catch (error: any) {
      console.error('❌ Error getting multiple booking counts:', error)
      throw error
    }
  },

  async setExpiration(empresaId: string, date: string, planUpdatedAt: string): Promise<void> {
    const key = this.getKey(empresaId, date, planUpdatedAt)
    const redis = await createRedisClient()
    
    // Calcular la fecha de fin del período actual
    const planDate = new Date(planUpdatedAt)
    const currentDate = new Date(date)
    const nextResetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      planDate.getDate(),
      23,
      59,
      59
    )
    
    // Si estamos después del día de reset, avanzar al próximo mes
    if (currentDate.getDate() >= planDate.getDate()) {
      nextResetDate.setMonth(nextResetDate.getMonth() + 1)
    }
    
    // Calcular segundos hasta el próximo reset
    const secondsUntilReset = Math.floor((nextResetDate.getTime() - currentDate.getTime()) / 1000)
    
    await redis.expire(key, secondsUntilReset)
  }
} 