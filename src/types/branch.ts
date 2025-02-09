import { Database } from '@/types/supabase'

export type Branch = Database['public']['Tables']['sedes']['Row']

export interface BranchFormData {
  name: string
  address: string
  phone: string
  manager_id?: string | null
  is_active: boolean
  opening_hours: Record<string, {
    isOpen: boolean
    timeRanges: Array<{
      openTime: string
      closeTime: string
    }>
  }>
  settings?: Record<string, any> | null
} 