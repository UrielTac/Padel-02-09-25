import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { type Database } from '@/types/supabase'

// Validación de variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase')
}

// Singleton pattern para el cliente de Supabase
class SupabaseClientSingleton {
  private static instance: ReturnType<typeof createSupabaseClient<Database>> | null = null

  private constructor() {}

  public static getInstance(): ReturnType<typeof createSupabaseClient<Database>> {
    if (!SupabaseClientSingleton.instance) {
      SupabaseClientSingleton.instance = createSupabaseClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: typeof window !== 'undefined' ? window.localStorage : undefined
          }
        }
      )
    }
    return SupabaseClientSingleton.instance
  }
}

// Exportamos una única función para obtener la instancia
export const getSupabaseClient = () => SupabaseClientSingleton.getInstance() 