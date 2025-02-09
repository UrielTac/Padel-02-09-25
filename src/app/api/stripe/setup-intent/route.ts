import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { createId } from '@paralleldrive/cuid2';
import { stripeCustomerService } from '@/services/stripe-customer.service';

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

// Por ahora, usar un usuario por defecto
const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID;

// Inicializar Supabase con service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const requestId = createId();
  console.log(`🔄 [${requestId}] Iniciando creación de SetupIntent`);

  try {
    const { stripeAccountId } = await request.json();

    if (!stripeAccountId) {
      console.warn(`⚠️ [${requestId}] No se proporcionó el ID de cuenta de Stripe`);
      return NextResponse.json(
        { error: 'Se requiere el ID de la cuenta de Stripe' },
        { status: 400 }
      );
    }

    if (!DEFAULT_USER_ID) {
      console.warn(`⚠️ [${requestId}] DEFAULT_USER_ID no está configurado`);
      return NextResponse.json(
        { error: 'DEFAULT_USER_ID no está configurado' },
        { status: 500 }
      );
    }

    console.log(`✅ [${requestId}] Verificando conexión en base de datos:`, stripeAccountId);

    // 1. Verificar la empresa y su conexión Stripe
    const { data: connection, error: dbError } = await supabase
      .from('stripe_connections')
      .select(`
        stripe_account_id,
        charges_enabled,
        account_status,
        payouts_enabled,
        empresa_id,
        empresas (
          id,
          auth_user_id,
          is_active
        )
      `)
      .eq('stripe_account_id', stripeAccountId)
      .single();

    if (dbError) {
      console.error(`❌ [${requestId}] Error de base de datos:`, {
        error: dbError,
        details: dbError.details,
        hint: dbError.hint
      });
      return NextResponse.json(
        { error: 'Error al verificar la conexión de Stripe en nuestra base de datos' },
        { status: 500 }
      );
    }

    if (!connection) {
      console.warn(`⚠️ [${requestId}] Conexión no encontrada en DB:`, {
        stripeAccountId,
        query: 'stripe_connections.stripe_account_id'
      });
      return NextResponse.json(
        { error: 'Esta cuenta de Stripe no está registrada en nuestro sistema' },
        { status: 404 }
      );
    }

    // Verificar si la empresa está activa
    if (!connection.empresas?.is_active) {
      console.warn(`⚠️ [${requestId}] Empresa inactiva:`, {
        empresa_id: connection.empresa_id
      });
      return NextResponse.json(
        { error: 'La empresa asociada a esta cuenta no está activa' },
        { status: 400 }
      );
    }

    console.log(`✅ [${requestId}] Conexión encontrada:`, {
      empresa_id: connection.empresa_id,
      account_status: connection.account_status,
      is_active: connection.empresas?.is_active
    });

    // 2. Verificar estado en Stripe
    try {
      console.log(`✅ [${requestId}] Verificando estado en Stripe para empresa:`, connection.empresa_id);
      
      const stripeAccount = await stripe.accounts.retrieve(stripeAccountId);
      
      console.log(`✅ [${requestId}] Estado de cuenta Stripe:`, {
        id: stripeAccount.id,
        charges_enabled: stripeAccount.charges_enabled,
        details_submitted: stripeAccount.details_submitted
      });

      if (!stripeAccount.charges_enabled) {
        return NextResponse.json(
          { 
            error: 'La cuenta no tiene habilitados los cargos. Por favor, complete la configuración de Stripe.',
            details: {
              accountId: stripeAccountId,
              status: stripeAccount.details_submitted ? 'pending_verification' : 'incomplete'
            }
          },
          { status: 400 }
        );
      }
    } catch (stripeError) {
      console.error(`❌ [${requestId}] Error al verificar cuenta en Stripe:`, stripeError);
      return NextResponse.json(
        { error: 'Error al verificar el estado de la cuenta en Stripe' },
        { status: 400 }
      );
    }

    // 3. Obtener o crear el customer
    console.log(`✅ [${requestId}] Obteniendo customer para:`, {
      userId: DEFAULT_USER_ID,
      stripeAccountId
    });

    const customer = await stripeCustomerService.getOrCreateCustomer(
      DEFAULT_USER_ID,
      stripeAccountId
    );

    console.log(`✅ [${requestId}] Customer obtenido:`, {
      customerId: customer.stripeCustomerId,
      status: customer.status
    });

    // 4. Crear SetupIntent asociado al customer
    console.log(`✅ [${requestId}] Creando SetupIntent para:`, {
      customerId: customer.stripeCustomerId,
      stripeAccountId
    });

    const setupIntent = await stripe.setupIntents.create(
      {
        customer: customer.stripeCustomerId,
        payment_method_types: ['card'],
        usage: 'off_session',
      },
      {
        stripeAccount: stripeAccountId,
      }
    );

    console.log(`✅ [${requestId}] SetupIntent creado exitosamente:`, {
      setupIntentId: setupIntent.id,
      customerId: setupIntent.customer
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      customerId: customer.stripeCustomerId,
      requestId
    });

  } catch (error) {
    console.error(`❌ [${requestId}] Error al crear SetupIntent:`, error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          error: 'Error de Stripe al procesar la solicitud',
          details: {
            type: error.type,
            code: error.code,
            message: error.message
          }
        },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Error interno al procesar la solicitud',
        requestId 
      },
      { status: 500 }
    );
  }
} 