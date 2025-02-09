import { Database } from '@/types/supabase'

export type Branch = Database['public']['Tables']['sedes']['Row']

export interface TimeRange {
  openTime: string
  closeTime: string
}

export interface DaySchedule {
  isOpen: boolean
  timeRanges: TimeRange[]
}

export interface OpeningHours {
  [key: string]: DaySchedule
}

export interface BranchFormData {
  name: string
  address: string
  phone: string
  manager_id: string
  is_active: boolean
  opening_hours: OpeningHours
  settings?: Record<string, any>
}

export interface Branch extends BranchFormData {
  id: string
  empresa_id: string
  created_at: string
  updated_at: string
} 