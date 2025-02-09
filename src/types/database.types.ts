import type { Database } from './supabase'

// Tipos derivados de la base de datos
export type Branch = Database['public']['Tables']['sedes']['Row']
export type Court = Database['public']['Tables']['courts']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Class = Database['public']['Tables']['classes']['Row']
export type Package = Database['public']['Tables']['packages']['Row']
export type Usuario = Database['public']['Tables']['usuarios']['Row']
export type Vinculacion = Database['public']['Tables']['vinculaciones']['Row']
export type CompanyLink = Database['public']['Tables']['company_links']['Row']

// Tipos de respuesta
export interface BranchResponse {
  id: string
  name: string
  address: string | null
  phone: string | null
  is_active: boolean
  empresa_id: string
  created_at: string
}

export interface CourtResponse {
  id: string
  name: string
  branch_id: string
  sport: string
  court_type: string
  surface: string
  is_active: boolean
  created_at: string
}

export interface BookingResponse {
  id: string
  court_id: string
  date: string
  start_time: string
  end_time: string
  total_price: number
  payment_status: string
  created_at: string
}

// Tipos de request
export interface CreateBranchRequest {
  name: string
  address?: string
  phone?: string
  empresa_id: string
}

export interface UpdateBranchRequest {
  name?: string
  address?: string
  phone?: string
  is_active?: boolean
}

export interface CreateCourtRequest {
  name: string
  branch_id: string
  sport: string
  court_type: string
  surface: string
}

export interface UpdateCourtRequest {
  name?: string
  sport?: string
  court_type?: string
  surface?: string
  is_active?: boolean
}

// Tipos de error
export interface DatabaseError {
  message: string
  code?: string
  details?: string
}

export type PaymentStatusEnum = 'pending' | 'partial' | 'completed'
export type PaymentMethodEnum = 'cash' | 'stripe' | 'transfer'

export interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  gender?: string
  notes?: string
  status: string
  created_at: string
  updated_at: string
  reservation_stats?: ReservationStats
}

export interface PaymentDetails {
  totalAmount: number
  deposit: number
  paymentStatus: PaymentStatusEnum
  paymentMethod: PaymentMethodEnum
}

export interface BookingCreationData {
  courtId: string
  date: string
  startTime: string
  endTime: string
  title?: string
  description?: string
  totalPrice: number
  paymentStatus: PaymentStatusEnum
  paymentMethod: PaymentMethodEnum
  depositAmount: number
  participants: Array<{
    memberId: string
    role: 'player' | 'guest'
  }>
  rentalItems: Array<{
    itemId: string
    quantity: number
    pricePerUnit: number
  }>
} 