import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripeCustomerService } from '@/services/stripe-customer.service';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY no está configurado');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'
});

// Por ahora, usar un usuario por defecto
const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID;

export async function POST(request: Request) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`📝 [${requestId}] Iniciando listado de métodos de pago`);

  try {
    const { stripeAccountId } = await request.json();

    if (!stripeAccountId) {
      console.warn(`⚠️ [${requestId}] No se proporcionó el ID de cuenta de Stripe`);
      return NextResponse.json(
        { error: 'stripeAccountId es requerido' },
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

    console.log(`📍 [${requestId}] Obteniendo customer para:`, {
      userId: DEFAULT_USER_ID,
      stripeAccountId
    });

    // 1. Obtener o crear el customer
    const customer = await stripeCustomerService.getOrCreateCustomer(
      DEFAULT_USER_ID,
      stripeAccountId
    );

    console.log(`✅ [${requestId}] Customer encontrado:`, {
      customerId: customer.stripeCustomerId,
      status: customer.status
    });

    // 2. Listar métodos de pago del customer
    const paymentMethods = await stripe.paymentMethods.list(
      {
        customer: customer.stripeCustomerId,
        type: 'card'
      },
      {
        stripeAccount: stripeAccountId
      }
    );

    // 3. Transformar los datos para el frontend
    const formattedMethods = paymentMethods.data.map(method => ({
      id: method.id,
      brand: method.card?.brand || 'unknown',
      last4: method.card?.last4 || '****',
      expMonth: method.card?.exp_month || 0,
      expYear: method.card?.exp_year || 0
    }));

    console.log(`✅ [${requestId}] Métodos de pago encontrados:`, {
      count: formattedMethods.length,
      methods: formattedMethods
    });

    return NextResponse.json({ 
      paymentMethods: formattedMethods,
      customerId: customer.stripeCustomerId
    });

  } catch (error) {
    console.error(`❌ [${requestId}] Error al listar métodos de pago:`, {
      error,
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 400 }
    );
  }
} 