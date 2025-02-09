import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

interface UpdatePayPalDetailsData {
  empresaId: string
  subscriptionId: string
  subscriptionExpiresAt: Date
  paymentAmount: number
}

interface PayPalSubscriptionDetails {
  id: string
  status: string
  start_time: string
  quantity: string
  create_time: string
  plan_overridden: boolean
  plan_id: string
  next_billing_time: string
}

const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2 segundos

export const subscriptionService = {
  async updatePayPalDetails(data: UpdatePayPalDetailsData) {
    console.log('📍 Actualizando detalles de PayPal:', data)
    const supabase = createClientComponentClient<Database>()
    
    try {
      // Primero verificamos si ya existe una suscripción activa
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('empresa_id', data.empresaId)
        .eq('plan_status', 'active')
        .single()

      if (existingSubscription) {
        console.log('📍 Desactivando suscripción anterior')
        await supabase
          .from('subscriptions')
          .update({ plan_status: 'expired' })
          .eq('id', existingSubscription.id)
      }

      // Creamos la nueva suscripción
      const { data: newSubscription, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          empresa_id: data.empresaId,
          subscription_id: data.subscriptionId,
          plan_status: 'active',
          subscription_expires_at: data.subscriptionExpiresAt.toISOString(),
          last_payment_date: new Date().toISOString(),
          next_payment_date: data.subscriptionExpiresAt.toISOString(),
          payment_status: 'paid',
          payment_amount: data.paymentAmount,
          currency: 'EUR',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ Error al crear la suscripción:', insertError)
        throw new Error(`Error al crear la suscripción: ${insertError.message}`)
      }

      console.log('✅ Suscripción creada exitosamente:', newSubscription)
      return newSubscription
    } catch (error) {
      console.error('❌ Error en el servicio de suscripción:', error)
      throw error
    }
  },

  async getActiveSubscription(empresaId: string) {
    console.log('📍 Buscando suscripción activa para empresa:', empresaId)
    const supabase = createClientComponentClient<Database>()

    try {
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('plan_status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('❌ Error al buscar la suscripción:', error)
        return null
      }

      return subscriptions && subscriptions.length > 0 ? subscriptions[0] : null
    } catch (error) {
      console.error('❌ Error en el servicio de suscripción:', error)
      return null
    }
  }
} 