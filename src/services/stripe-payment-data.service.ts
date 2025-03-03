import { createId } from '@paralleldrive/cuid2';
import { Database } from '@/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

interface StripePaymentData {
  customerId: string;
  accountId: string;
  userId: string;
  paymentMethodId: string;
}

export class StripePaymentDataService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getPaymentData(params: {
    paymentMethodId: string;
    empresaId?: string;
    existingCustomerId?: string;
    existingAccountId?: string;
  }): Promise<StripePaymentData> {
    const requestId = createId();
    console.log(`[${requestId}] Obteniendo datos de pago:`, {
      paymentMethodId: params.paymentMethodId,
      hasExistingCustomerId: !!params.existingCustomerId,
      hasExistingAccountId: !!params.existingAccountId,
      timestamp: new Date().toISOString()
    });

    try {
      // Si ya tenemos los IDs, los usamos directamente
      if (params.existingCustomerId && params.existingAccountId) {
        console.log(`[${requestId}] ✅ Usando datos existentes de Stripe`);
        
        // Obtener el usuario actual solo para el userId
        const { data: { user }, error: userError } = await this.supabase.auth.getUser();
        if (!user || userError) {
          throw new Error('Usuario no autenticado');
        }

        return {
          customerId: params.existingCustomerId,
          accountId: params.existingAccountId,
          userId: user.id,
          paymentMethodId: params.paymentMethodId
        };
      }

      // Si no tenemos los IDs, los buscamos en la base de datos
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (!user || userError) {
        console.error(`[${requestId}] Error: Usuario no autenticado`);
        throw new Error('Usuario no autenticado');
      }

      const { data: stripeCustomer, error: customerError } = await this.supabase
        .from('stripe_customers')
        .select('stripe_customer_id, stripe_account_id, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (customerError || !stripeCustomer) {
        console.error(`[${requestId}] Error: Cliente Stripe no encontrado`);
        throw new Error('Cliente Stripe no encontrado');
      }

      console.log(`[${requestId}] ✅ Datos de Stripe obtenidos:`, {
        hasCustomerId: !!stripeCustomer.stripe_customer_id,
        hasAccountId: !!stripeCustomer.stripe_account_id,
        userId: user.id,
        timestamp: new Date().toISOString()
      });

      return {
        customerId: stripeCustomer.stripe_customer_id,
        accountId: stripeCustomer.stripe_account_id,
        userId: user.id,
        paymentMethodId: params.paymentMethodId
      };
    } catch (error: any) {
      console.error(`[${requestId}] ❌ Error al obtener datos de pago:`, error);
      throw error;
    }
  }
} 