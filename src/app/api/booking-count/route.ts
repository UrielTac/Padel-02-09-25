import { NextRequest, NextResponse } from 'next/server'
import { bookingCountService } from '@/services/bookingCountService'
import { bookingCounters } from '@/lib/redis'
import { createSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const requestSchema = z.object({
  empresaId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})

async function getCompanyPlanInfo(empresaId: string): Promise<{ 
  isPro: boolean
  limit: number
  planUpdatedAt: string 
}> {
  const supabase = createSupabaseClient()
  
  try {
    // Consulta optimizada usando join implícito
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select(`
        plan_type,
        plan_id,
        plan_updated_at,
        subscription_plans!inner (
          daily_booking_limit,
          code
        )
      `)
      .eq('id', empresaId)
      .single()

    if (empresaError) {
      console.error('❌ Error al obtener información de empresa:', empresaError)
      throw new Error(`Empresa no encontrada: ${empresaError.message}`)
    }

    // Asegurar que tenemos los datos necesarios
    if (!empresa || !empresa.plan_updated_at) {
      throw new Error('Datos de empresa incompletos')
    }

    // Usar plan_type de la empresa como fuente de verdad
    const isPro = empresa.plan_type === 'PRO'

    // Para planes PRO, retornar límite infinito
    if (isPro) {
      return {
        isPro: true,
        limit: Number.MAX_SAFE_INTEGER,
        planUpdatedAt: empresa.plan_updated_at
      }
    }

    // Para planes FREE, usar la configuración de subscription_plans
    const planConfig = Array.isArray(empresa.subscription_plans) 
      ? empresa.subscription_plans[0] 
      : empresa.subscription_plans

    console.log('📍 Plan Info:', {
      empresaId,
      planType: empresa.plan_type,
      planId: empresa.plan_id,
      planUpdatedAt: empresa.plan_updated_at,
      subscriptionPlan: empresa.subscription_plans
    })

    return {
      isPro: false,
      limit: planConfig?.daily_booking_limit ?? 90, // Valor por defecto si no se encuentra el plan
      planUpdatedAt: empresa.plan_updated_at
    }
  } catch (error: any) {
    console.error('❌ Error al obtener información del plan:', error)
    // Valores por defecto en caso de error
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
  
  // Obtener el día del mes del plan
  const resetDay = updateDate.getDate()
  
  // Crear fecha de reset en el mes actual
  const resetDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    resetDay,
    23,
    59,
    59,
    999
  )
  
  // Si hoy es después o igual al día de reset, avanzar al próximo mes
  if (today.getDate() >= resetDay) {
    resetDate.setMonth(resetDate.getMonth() + 1)
  }
  
  // Manejar el cambio de año si es necesario
  if (resetDate.getMonth() === 0 && today.getMonth() === 11) {
    resetDate.setFullYear(resetDate.getFullYear() + 1)
  }
  
  console.log('📅 Calculated reset date:', {
    planUpdatedAt,
    today: today.toISOString(),
    resetDate: resetDate.toISOString(),
    dayOfMonth: resetDay,
    currentDay: today.getDate(),
    shouldAdvanceMonth: today.getDate() >= resetDay
  })
  
  return resetDate
}

function getCurrentPeriodStart(planUpdatedAt: string): Date {
  const updateDate = new Date(planUpdatedAt)
  const today = new Date()
  
  // Obtener el día del mes del plan
  const resetDay = updateDate.getDate()
  
  // Crear fecha de inicio en el mes actual
  const startDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    resetDay,
    0,
    0,
    0,
    0
  )
  
  // Si hoy es antes del día de reset, retroceder un mes
  if (today.getDate() < resetDay) {
    startDate.setMonth(startDate.getMonth() - 1)
  }
  
  console.log('📅 Calculated period start:', {
    planUpdatedAt,
    today: today.toISOString(),
    startDate: startDate.toISOString(),
    dayOfMonth: resetDay,
    currentDay: today.getDate(),
    shouldGoBackMonth: today.getDate() < resetDay
  })
  
  return startDate
}

export async function GET(request: Request) {
  console.log('📍 GET /api/booking-count')
  try {
    const { searchParams } = new URL(request.url)
    const params = {
      empresaId: searchParams.get('empresaId'),
      date: searchParams.get('date')
    }

    const validationResult = requestSchema.safeParse(params)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Parámetros de solicitud inválidos',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const { empresaId, date } = validationResult.data

    // 1. Obtener información del plan
    const planInfo = await getCompanyPlanInfo(empresaId)

    // Si es PRO, retornar respuesta simplificada sin cálculos adicionales
    if (planInfo.isPro) {
      return NextResponse.json({
        currentCount: 0,
        limit: Number.MAX_SAFE_INTEGER,
        remainingBookings: Number.MAX_SAFE_INTEGER,
        resetTime: new Date().toISOString(),
        isPro: true,
        nextResetDate: new Date().toISOString()
      })
    }

    // 2. Para planes FREE, continuar con la lógica existente
    let currentCount = await bookingCounters.get(empresaId, date, planInfo.planUpdatedAt)
    let needsSync = false

    // Calcular fechas solo para planes FREE
    const periodStart = getCurrentPeriodStart(planInfo.planUpdatedAt)
    const nextReset = getNextResetDate(planInfo.planUpdatedAt)

    // 3. Verificar si necesitamos sincronizar con la base de datos
    const supabase = createSupabaseClient()
    const { count: dbCount, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresaId)
      .gte('date', periodStart.toISOString().split('T')[0])
      .lt('date', nextReset.toISOString().split('T')[0])
      .is('cancelled_at', null)

    if (!countError && dbCount !== currentCount) {
      console.log('⚠️ Count mismatch detected:', { redis: currentCount, db: dbCount })
      needsSync = true
      currentCount = dbCount || 0
      // Actualizar Redis
      await bookingCounters.reset(empresaId, date, planInfo.planUpdatedAt)
      if (currentCount > 0) {
        await bookingCounters.increment(empresaId, date, planInfo.planUpdatedAt)
      }
    }

    return NextResponse.json({
      currentCount,
      limit: planInfo.limit,
      remainingBookings: Math.max(0, planInfo.limit - currentCount),
      resetTime: nextReset.toISOString(),
      needsSync,
      isPro: false,
      nextResetDate: nextReset.toISOString()
    })
  } catch (error: any) {
    console.error('❌ Error al obtener el estado de las reservas:', error)
    return NextResponse.json(
      { 
        error: 'Error al obtener el estado de las reservas',
        details: error.message
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { empresaId, date, action } = body

    if (!empresaId || !date || !action) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    // 1. Verificar plan de la empresa
    const planInfo = await getCompanyPlanInfo(empresaId)
    
    // Si es PRO, no realizar conteo
    if (planInfo.isPro) {
      return NextResponse.json({ 
        count: 0,
        action,
        timestamp: new Date().toISOString(),
        isPro: true,
        nextResetDate: getNextResetDate(planInfo.planUpdatedAt).toISOString()
      })
    }

    console.log('📍 Procesando acción de reserva:', { empresaId, date, action })
    let result: number = 0

    switch (action) {
      case 'increment': {
        // Verificar límite antes de incrementar
        const currentCount = await bookingCounters.get(empresaId, date, planInfo.planUpdatedAt)

        if (currentCount >= planInfo.limit) {
          return NextResponse.json(
            { error: 'Se ha alcanzado el límite de reservas del período' },
            { status: 400 }
          )
        }

        result = await bookingCounters.increment(empresaId, date, planInfo.planUpdatedAt)
        break
      }
      case 'decrement': {
        const currentCount = await bookingCounters.get(empresaId, date, planInfo.planUpdatedAt)
        if (currentCount > 0) {
          await bookingCounters.reset(empresaId, date, planInfo.planUpdatedAt)
          const newCount = currentCount - 1
          if (newCount > 0) {
            result = await bookingCounters.increment(empresaId, date, planInfo.planUpdatedAt)
          }
        }
        break
      }
      case 'reset':
        await bookingCounters.reset(empresaId, date, planInfo.planUpdatedAt)
        break
      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }

    const nextReset = getNextResetDate(planInfo.planUpdatedAt)

    return NextResponse.json({ 
      count: result,
      action,
      timestamp: new Date().toISOString(),
      isPro: false,
      nextResetDate: nextReset.toISOString()
    })
  } catch (error: any) {
    console.error('❌ Error en booking-count API:', error)
    return NextResponse.json(
      { error: 'Error al procesar la acción de reserva' },
      { status: 500 }
    )
  }
} 