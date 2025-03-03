import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { Database } from '@/types/supabase';
import { createId } from '@paralleldrive/cuid2';
import { StripePaymentDataService } from '@/services/stripe-payment-data.service';

// Esquema de validación para la solicitud
const paymentDataSchema = z.object({
  paymentMethodId: z.string(),
  empresaId: z.string().optional()
});

export async function POST(request: Request) {
  const requestId = createId();
  
  try {
    // 1. Validar el body de la solicitud
    const body = await request.json();
    const result = paymentDataSchema.safeParse(body);
    
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

    // 2. Obtener cliente de Supabase
    const supabase = createServerComponentClient<Database>({ cookies });

    // 3. Crear instancia del servicio
    const paymentDataService = new StripePaymentDataService(supabase);

    // 4. Obtener datos de pago
    const paymentData = await paymentDataService.getPaymentData({
      paymentMethodId: result.data.paymentMethodId,
      empresaId: result.data.empresaId
    });

    // 5. Devolver respuesta exitosa
    return NextResponse.json({
      success: true,
      data: paymentData
    });

  } catch (error: any) {
    console.error(`[${requestId}] Error:`, error);
    
    // Determinar el tipo de error para una respuesta más específica
    const errorResponse = {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message || 'Error interno del servidor',
        details: error
      }
    };

    // Ajustar el código de estado según el tipo de error
    const statusCode = error.message?.includes('no autenticado') ? 401 
      : error.message?.includes('no encontrado') ? 404 
      : 500;

    return NextResponse.json(errorResponse, { status: statusCode });
  }
} 