import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createId } from '@paralleldrive/cuid2';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { StripePaymentService } from '@/services/stripe-payment.service';
import type { NoShowChargeRequest, NoShowChargeResponse } from '@/types/api';

// Inicializar servicio de pagos
const paymentService = new StripePaymentService(stripe, supabaseAdmin);

export async function POST(request: Request): Promise<NextResponse<NoShowChargeResponse>> {
  const requestId = createId();
  console.log(`🔄 [${requestId}] Iniciando proceso de cargo por no-show`);

  try {
    // Verificar autenticación
    const authClient = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await authClient.auth.getSession();

    if (!session) {
      console.warn(`⚠️ [${requestId}] Usuario no autenticado`);
      return NextResponse.json(
        { 
          success: false,
          error: {
            message: 'No autorizado',
            code: 'UNAUTHORIZED'
          }
        },
        { status: 401 }
      );
    }

    const payload = await request.json() as NoShowChargeRequest;
    const { bookingId, reason, amount, stripeAccountId } = payload;

    // 1. Validar parámetros requeridos
    if (!bookingId || !amount || !stripeAccountId) {
      console.warn(`⚠️ [${requestId}] Parámetros incompletos:`, {
        bookingId,
        amount,
        stripeAccountId
      });
      return NextResponse.json(
        { 
          success: false,
          error: {
            message: 'Se requieren todos los parámetros: bookingId, amount, stripeAccountId',
            code: 'INVALID_PARAMETERS'
          }
        },
        { status: 400 }
      );
    }

    // 2. Procesar cargo usando el servicio
    const result = await paymentService.chargeNoShow({
      bookingId,
      amount,
      reason,
      stripeAccountId
    });

    // 3. Manejar respuesta
    if (!result.success) {
      const status = result.error?.code === 'UNAUTHORIZED' ? 401 : 
                    result.error?.code === 'BOOKING_NOT_FOUND' ? 404 : 
                    result.error?.code === 'STRIPE_ERROR' ? 500 : 400;

      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error(`❌ [${requestId}] Error general:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          message: 'Error interno al procesar la solicitud',
          code: 'INTERNAL_ERROR',
          details: error.message
        }
      },
      { status: 500 }
    );
  }
} 