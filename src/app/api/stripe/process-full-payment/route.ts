import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';
import { FullPaymentService } from '@/services/full-payment.service';
import { z } from 'zod';
import { createId } from '@paralleldrive/cuid2';
import { Database } from '@/types/supabase';

// Esquema de validación para la solicitud
const fullPaymentSchema = z.object({
  bookingId: z.string(),
  amount: z.number().positive(),
  stripePaymentMethodId: z.string(),
  stripeAccountId: z.string(),
  stripeCustomerId: z.string().optional(),
  empresaId: z.string().optional(),
  description: z.string().optional(),
  paymentType: z.string().optional().default('booking'),
  paymentMethod: z.string().optional().default('stripe')
});

export async function POST(request: Request) {
  const requestId = createId();

  try {
    // Obtener y validar el body de la solicitud
    const body = await request.json();
    console.log(`[${requestId}] Recibida solicitud de pago completo:`, body);

    const result = fullPaymentSchema.safeParse(body);
    if (!result.success) {
      console.error(`[${requestId}] Error de validación:`, result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR',
            message: 'Datos de solicitud inválidos',
            details: result.error.format() 
          } 
        },
        { status: 400 }
      );
    }

    const data = result.data;
    
    // Asegurar que el tipo sea 'booking' y el método 'stripe'
    const paymentType = data.paymentType === 'full' ? 'booking' : data.paymentType;
    const paymentMethod = 'stripe';
    
    console.log(`[${requestId}] Procesando pago con tipo "${paymentType}" y método "${paymentMethod}":`, {
      bookingId: data.bookingId,
      amount: data.amount
    });

    const supabase = createServerComponentClient<Database>({ cookies });

    // Verificar que la reserva existe
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('id', data.bookingId)
      .single();

    if (bookingError || !booking) {
      console.error(`[${requestId}] Reserva no encontrada:`, { bookingId: data.bookingId, error: bookingError });
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'BOOKING_NOT_FOUND',
            message: 'No se encontró la reserva especificada' 
          } 
        },
        { status: 404 }
      );
    }

    // Validar que la reserva esté en estado válido para pago
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_BOOKING_STATUS',
            message: `No se puede procesar el pago para una reserva en estado "${booking.status}"` 
          } 
        },
        { status: 400 }
      );
    }

    // Inicializar Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      // @ts-ignore - Ignorar error de versión de API
      apiVersion: '2023-10-16',
    });

    // Crear servicio de pago
    const paymentService = new FullPaymentService(stripe, supabase);

    // Procesar el pago
    const paymentResult = await paymentService.processFullPayment({
      bookingId: data.bookingId,
      amount: data.amount,
      stripePaymentMethodId: data.stripePaymentMethodId,
      stripeAccountId: data.stripeAccountId,
      stripeCustomerId: data.stripeCustomerId || '',
      empresaId: data.empresaId || '',
      description: data.description,
      paymentType: paymentType,
      paymentMethod: paymentMethod
    });

    if (!paymentResult.success) {
      console.error(`[${requestId}] Error al procesar pago:`, paymentResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: paymentResult.error
        },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Pago procesado exitosamente:`, {
      paymentIntentId: paymentResult.paymentIntentId,
      status: paymentResult.chargeStatus,
      type: paymentType,
      method: paymentMethod
    });

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentResult.paymentIntentId,
      chargeStatus: paymentResult.chargeStatus
    });
  } catch (error: any) {
    console.error(`[${requestId}] Error inesperado:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SERVER_ERROR',
          message: 'Error interno del servidor',
          details: error.message 
        } 
      },
      { status: 500 }
    );
  }
} 