import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Cliente normal para empresas
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Cliente con service role para stripe_connections
const serviceClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
)

export async function GET() {
  try {
    const defaultUserId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID;
    if (!defaultUserId) {
      console.error('❌ NEXT_PUBLIC_DEFAULT_USER_ID no está definido');
      return NextResponse.json(
        { error: 'Configuración de usuario no válida' },
        { status: 400 }
      );
    }

    console.log('📍 Verificando conexión de Stripe para usuario:', defaultUserId);

    // Primero obtenemos la empresa del usuario
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id, name, auth_user_id')
      .eq('auth_user_id', defaultUserId)
      .single();

    if (empresaError) {
      console.error('❌ Error al consultar la empresa:', empresaError);
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    if (!empresa) {
      console.error('❌ No se encontró empresa para el usuario:', defaultUserId);
      return NextResponse.json(
        { error: 'Empresa no encontrada para el usuario' },
        { status: 404 }
      );
    }

    console.log('✅ Empresa encontrada:', {
      id: empresa.id,
      name: empresa.name,
      auth_user_id: empresa.auth_user_id
    });

    // Consulta SQL directa para debug
    const { data: rawConnections, error: rawError } = await serviceClient
      .from('stripe_connections')
      .select('*')
      .eq('empresa_id', empresa.id);

    console.log('🔍 Debug SQL:', {
      sql: `SELECT * FROM stripe_connections WHERE empresa_id = '${empresa.id}'`,
      raw_result: rawConnections,
      raw_error: rawError
    });

    // Consulta principal
    const { data: stripeConnections, error: stripeError } = await serviceClient
      .from('stripe_connections')
      .select('*')
      .eq('empresa_id', empresa.id);

    // Debug detallado
    console.log('🔍 Debug de conexión Stripe:', {
      empresa_id: empresa.id,
      empresa_id_length: empresa.id?.length,
      empresa_id_type: typeof empresa.id,
      found_connections: stripeConnections?.length || 0,
      error: stripeError,
      service_role_key_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    });

    if (stripeError) {
      console.error('❌ Error al consultar stripe_connections:', stripeError);
      return NextResponse.json(
        { error: 'Error al verificar la conexión con Stripe' },
        { status: 500 }
      );
    }

    if (!stripeConnections?.length) {
      console.log('❌ No se encontró conexión de Stripe para la empresa:', empresa.id);
      return NextResponse.json({
        stripeAccountId: null,
        isConnected: false,
        reason: 'no_connection_found'
      });
    }

    const stripeConnection = stripeConnections[0];
    console.log('✅ Conexión Stripe encontrada:', {
      id: stripeConnection.id,
      stripeAccountId: stripeConnection.stripe_account_id,
      chargesEnabled: stripeConnection.charges_enabled,
      accountStatus: stripeConnection.account_status
    });

    const response = {
      stripeAccountId: stripeConnection.stripe_account_id,
      isConnected: Boolean(stripeConnection.stripe_account_id && stripeConnection.charges_enabled),
      accountStatus: stripeConnection.account_status
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error general al obtener el estado de la conexión:', error);
    return NextResponse.json(
      { error: 'Error al verificar la conexión con Stripe' },
      { status: 500 }
    );
  }
} 