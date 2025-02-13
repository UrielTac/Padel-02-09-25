import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

type TypedSupabaseClient = SupabaseClient<Database>

// Validación de credenciales de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ Supabase credentials missing', { supabaseUrl, supabaseKey })
  throw new Error('Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables')
}

// Validar que la URL sea válida
try {
  new URL(supabaseUrl)
} catch (error) {
  console.error('⚠️ Invalid Supabase URL:', supabaseUrl)
  throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL. Must be a valid URL.')
}

// Instancia simple para compatibilidad con onboarding
export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Singleton para el cliente de Supabase
class SupabaseClientSingleton {
  private static instance: TypedSupabaseClient | null = null
  private static adminInstance: TypedSupabaseClient | null = null

  private constructor() {}

  public static getInstance(): TypedSupabaseClient {
    if (typeof window === 'undefined') {
      // Para SSR, siempre crear un nuevo cliente
      return createClientComponentClient<Database>()
    }

    if (!SupabaseClientSingleton.instance) {
      SupabaseClientSingleton.instance = createClientComponentClient<Database>({
        options: {
          global: {
            headers: {
              'x-application-name': 'padel-panel'
            }
          }
        }
      })
    }

    return SupabaseClientSingleton.instance
  }

  public static getAdminInstance(): TypedSupabaseClient {
    if (typeof window === 'undefined') {
      // Para SSR, siempre crear un nuevo cliente
      return createClientComponentClient<Database>()
    }

    if (!SupabaseClientSingleton.adminInstance) {
      SupabaseClientSingleton.adminInstance = createClientComponentClient<Database>({
        options: {
          global: {
            headers: {
              'x-application-name': 'padel-panel-admin',
              'x-admin-access': 'true'
            }
          }
        }
      })
    }

    return SupabaseClientSingleton.adminInstance
  }

  public static clearInstance(): void {
    SupabaseClientSingleton.instance = null
    SupabaseClientSingleton.adminInstance = null
  }
}

// Exportar funciones de utilidad
export const createSupabaseClient = () => SupabaseClientSingleton.getInstance()
export const createAdminSupabaseClient = () => SupabaseClientSingleton.getAdminInstance()
export const clearSupabaseClient = () => SupabaseClientSingleton.clearInstance() 
