import { createSupabaseClient } from '@/lib/supabase'

const supabase = createSupabaseClient()

export const organizationService = {
  async getCurrentOrganization() {
    try {
      console.log('📍 Obteniendo organización actual...')
      
      // Primero verificamos si la tabla existe
      const { error: tableError } = await supabase
        .from('empresas')
        .select('count')
        .limit(1)
        .single()

      if (tableError && tableError.code === '42P01') {
        throw new Error('La tabla empresas no existe en la base de datos')
      }

      // Intentamos obtener la primera empresa
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('⚠️ No se encontraron empresas activas')
          return { data: null, error: new Error('No hay empresas registradas') }
        }
        console.error('❌ Error al obtener organización:', error)
        throw error
      }

      if (!data) {
        console.log('⚠️ No se encontró ninguna organización')
        return { data: null, error: new Error('No se encontró ninguna organización') }
      }

      console.log('✅ Organización obtenida:', data)
      return { data, error: null }
    } catch (error: any) {
      console.error('❌ Error getting empresa:', {
        error,
        message: error.message,
        code: error.code,
        details: error.details
      })
      return { 
        data: null, 
        error: {
          message: error.message || 'Error al obtener la organización',
          code: error.code,
          details: error.details
        }
      }
    }
  },
  async getOrganizationBySlug(slug: string) {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error al obtener organización:', error)
      throw error
    }
  }
} 