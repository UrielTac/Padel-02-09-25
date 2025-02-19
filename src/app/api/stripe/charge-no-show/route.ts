import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createId } from '@paralleldrive/cuid2';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { stripeDataService } from '@/services/server/stripe-data.service';
import { StripePaymentService } from '@/services/stripe-payment.service';
import type { NoShowChargeRequest, NoShowChargeResponse } from '@/types/api';

export async function POST(request: Request): Promise<NextResponse<NoShowChargeResponse>> {
  const requestId = createId();
  console.log(`🔄 [${requestId}] Iniciando proceso de cargo por no-show`);

  try {
    const payload = await request.json() as NoShowChargeRequest;
    const { bookingId, reason, amount } = payload;

    // Validar parámetros requeridos
    if (!bookingId || !amount) {
      console.warn(`⚠️ [${requestId}] Parámetros incompletos:`, {
        bookingId,
        amount,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { 
          success: false,
          error: {
            message: 'Parámetros incompletos',
            code: 'INVALID_PARAMETERS'
          }
        },
        { status: 400 }
      );
    }

    // 1. Obtener datos de Stripe usando el servicio del servidor
    console.log(`🔍 [${requestId}] Obteniendo datos de Stripe para:`, {
      bookingId,
      timestamp: new Date().toISOString()
    });

    const stripeData = await stripeDataService.getStripePaymentData(bookingId);
    
    // Log detallado de los datos obtenidos
    console.log(`📦 [${requestId}] Datos de Stripe recibidos:`, {
      success: Boolean(stripeData),
      hasCustomerId: Boolean(stripeData?.customerId),
      hasAccountId: Boolean(stripeData?.accountId),
      hasPaymentMethodId: Boolean(stripeData?.paymentMethodId),
      data: stripeData ? {
        customerId: stripeData.customerId,
        accountId: stripeData.accountId,
        paymentMethodId: stripeData.paymentMethodId
      } : null,
      timestamp: new Date().toISOString()
    });

    // Validación detallada
    if (!stripeData) {
      console.error(`❌ [${requestId}] No se obtuvieron datos de Stripe:`, {
        bookingId,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STRIPE_DATA_NOT_FOUND',
            message: 'No se encontraron datos de Stripe para la reserva'
          }
        },
        { status: 400 }
      );
    }

    // Validar campos específicos
    const missingFields = [];
    if (!stripeData.customerId) missingFields.push('customerId');
    if (!stripeData.accountId) missingFields.push('accountId');
    if (!stripeData.paymentMethodId) missingFields.push('paymentMethodId');

    if (missingFields.length > 0) {
      console.error(`❌ [${requestId}] Datos de Stripe incompletos:`, {
        bookingId,
        missingFields,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STRIPE_DATA_INCOMPLETE',
            message: 'Datos de Stripe incompletos',
            details: {
              missingFields
            }
          }
        },
        { status: 400 }
      );
    }

    // 2. Crear instancia de StripePaymentService y procesar el cargo
    const stripePaymentService = new StripePaymentService(stripe, supabaseAdmin);
    const chargeResult = await stripePaymentService.chargeNoShow({
      bookingId,
      amount,
      reason,
      stripeAccountId: stripeData.accountId,
      stripePaymentMethodId: stripeData.paymentMethodId,
      empresaId: payload.empresaId
    });

    if (!chargeResult.success) {
      console.error(`❌ [${requestId}] Error al procesar cargo:`, {
        error: chargeResult.error,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        {
          success: false,
          error: chargeResult.error
        },
        { status: 400 }
      );
    }

    // 3. Registrar el pago
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        booking_id: bookingId,
        amount: amount,
        payment_method: 'stripe',
        payment_status: 'completed',
        stripe_payment_method_id: stripeData.paymentMethodId,
        stripe_payment_intent_id: chargeResult.paymentIntentId,
        stripe_customer_id: stripeData.customerId,
        notes: `Cargo por no-show: ${reason || 'No especificado'}`
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // 4. Cancelar la reserva
    const { data: booking, error: bookingError } = await supabaseAdmin.rpc('cancel_booking_v1', {
      p_booking_id: bookingId,
      p_reason: reason,
      p_should_charge: false // Ya procesamos el cargo
    });

    if (bookingError) throw bookingError;

    return NextResponse.json({
      success: true,
      data: {
        booking_id: bookingId,
        cancelled_at: new Date().toISOString(),
        payment_id: payment.id,
        payment_status: 'completed',
        charge_status: chargeResult.chargeStatus
      }
    });

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