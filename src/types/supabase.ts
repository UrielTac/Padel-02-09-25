export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string
          name: string
          business_name: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          is_active: boolean | null
          settings: Record<string, any> | null
          created_at: string | null
          updated_at: string | null
          auth_user_id: string | null
          plan_type: string | null
          onboarding: string | null
          country: string | null
        }
        Insert: {
          id?: string
          name: string
          business_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          is_active?: boolean | null
          settings?: Record<string, any> | null
          created_at?: string | null
          updated_at?: string | null
          auth_user_id?: string | null
          plan_type?: string | null
          onboarding?: string | null
          country?: string | null
        }
        Update: {
          id?: string
          name?: string
          business_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          is_active?: boolean | null
          settings?: Record<string, any> | null
          created_at?: string | null
          updated_at?: string | null
          auth_user_id?: string | null
          plan_type?: string | null
          onboarding?: string | null
          country?: string | null
        }
      },
      courts: {
        Row: {
          id: string
          name: string
          branch_id: string
          sport: 'padel' | 'tennis' | 'badminton' | 'pickleball' | 'squash'
          court_type: 'indoor' | 'outdoor' | 'covered'
          surface: 'crystal' | 'synthetic' | 'clay' | 'grass' | 'rubber' | 'concrete' | 'panoramic' | 'premium'
          features: string[]
          is_active: boolean
          available_durations: number[]
          duration_pricing: Record<string, number>
          custom_pricing: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          branch_id: string
          sport: 'padel' | 'tennis' | 'badminton' | 'pickleball' | 'squash'
          court_type: 'indoor' | 'outdoor' | 'covered'
          surface: 'crystal' | 'synthetic' | 'clay' | 'grass' | 'rubber' | 'concrete' | 'panoramic' | 'premium'
          features?: string[]
          is_active?: boolean
          available_durations?: number[]
          duration_pricing?: Record<string, number>
          custom_pricing?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          branch_id?: string
          sport?: 'padel' | 'tennis' | 'badminton' | 'pickleball' | 'squash'
          court_type?: 'indoor' | 'outdoor' | 'covered'
          surface?: 'crystal' | 'synthetic' | 'clay' | 'grass' | 'rubber' | 'concrete' | 'panoramic' | 'premium'
          features?: string[]
          is_active?: boolean
          available_durations?: number[]
          duration_pricing?: Record<string, number>
          custom_pricing?: Record<string, any>
          updated_at?: string
        }
      },
      bookings: {
        Row: {
          id: string
          court_id: string
          date: string
          start_time: string
          end_time: string
          title: string
          description: string | null
          total_price: number
          rental_items: {
            item_id: string
            quantity: number
            price: number
          }[]
          participants: {
            member_id: string
            role: 'player' | 'guest'
          }[]
          payment_status: 'pending' | 'partial' | 'completed'
          payment_method: 'cash' | 'stripe' | 'transfer' | null
          deposit_amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          court_id: string
          date: string
          start_time: string
          end_time: string
          title: string
          description?: string
          total_price: number
          rental_items?: {
            item_id: string
            quantity: number
            price: number
          }[]
          participants: {
            member_id: string
            role: 'player' | 'guest'
          }[]
          payment_status: 'pending' | 'partial' | 'completed'
          payment_method?: 'cash' | 'stripe' | 'transfer'
          deposit_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          court_id?: string
          date?: string
          start_time?: string
          end_time?: string
          title?: string
          description?: string
          total_price?: number
          rental_items?: {
            item_id: string
            quantity: number
            price: number
          }[]
          participants?: {
            member_id: string
            role: 'player' | 'guest'
          }[]
          payment_status?: 'pending' | 'partial' | 'completed'
          payment_method?: 'cash' | 'stripe' | 'transfer'
          deposit_amount?: number
          updated_at?: string
        }
      },
      classes: {
        Row: {
          id: string
          empresa_id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          visibility: 'public' | 'private'
          start_date: string
          end_date: string | null
          is_recurring: boolean
          schedule_config: {
            days: number[]
            timeSlots: Array<{
              startTime: string
              endTime: string
              price: number
              capacity: number
              instructors: string[]
              courtIds: string[]
            }>
          }
          available_payment_methods: string[]
          payment_config: {
            currency?: string
            status?: string
          }
          status: 'active' | 'cancelled' | 'completed'
          created_by: string
          min_students: number
          branch_id: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          visibility: 'public' | 'private'
          start_date: string
          end_date?: string | null
          is_recurring?: boolean
          schedule_config: {
            days: number[]
            timeSlots: Array<{
              startTime: string
              endTime: string
              price: number
              capacity: number
              instructors: string[]
              courtIds: string[]
            }>
          }
          available_payment_methods: string[]
          payment_config?: {
            currency?: string
            status?: string
          }
          status?: 'active' | 'cancelled' | 'completed'
          created_by: string
          min_students?: number
          branch_id?: string | null
        }
        Update: {
          empresa_id?: string
          name?: string
          description?: string | null
          visibility?: 'public' | 'private'
          start_date?: string
          end_date?: string | null
          is_recurring?: boolean
          schedule_config?: {
            days: number[]
            timeSlots: Array<{
              startTime: string
              endTime: string
              price: number
              capacity: number
              instructors: string[]
              courtIds: string[]
            }>
          }
          available_payment_methods?: string[]
          payment_config?: {
            currency?: string
            status?: string
          }
          status?: 'active' | 'cancelled' | 'completed'
          min_students?: number
          branch_id?: string | null
          updated_at?: string
        }
      },
      packages: {
        Row: {
          id: string
          empresa_id: string
          created_at: string
          updated_at: string
          name: string
          class_count: number
          price: number
          expiration_days: number
          advance_booking_days: number
          branch_ids: string[]
          include_private_classes: boolean
          tag: string | null
          available_payment_methods: string[]
          status: 'active' | 'inactive' | 'archived'
          created_by: string
        }
        Insert: {
          id?: string
          empresa_id: string
          created_at?: string
          updated_at?: string
          name: string
          class_count: number
          price: number
          expiration_days: number
          advance_booking_days?: number
          branch_ids: string[]
          include_private_classes?: boolean
          tag?: string | null
          available_payment_methods: string[]
          status?: 'active' | 'inactive' | 'archived'
          created_by: string
        }
        Update: {
          id?: string
          empresa_id?: string
          name?: string
          class_count?: number
          price?: number
          expiration_days?: number
          advance_booking_days?: number
          branch_ids?: string[]
          include_private_classes?: boolean
          tag?: string | null
          available_payment_methods?: string[]
          status?: 'active' | 'inactive' | 'archived'
          created_by?: string
          updated_at?: string
        }
      },
      usuarios: {
        Row: {
          id: string
          email: string
          nombre: string
          empresa_id: string
          role: string
          created_at: string
          updated_at: string
          avatar_url?: string
        }
        Insert: {
          id: string
          email: string
          nombre: string
          empresa_id: string
          role?: string
          created_at?: string
          updated_at?: string
          avatar_url?: string
        }
        Update: {
          id?: string
          email?: string
          nombre?: string
          empresa_id?: string
          role?: string
          created_at?: string
          updated_at?: string
          avatar_url?: string
        }
      },
      vinculaciones: {
        Row: {
          id: string
          user_id: string
          empresa_id: string
          estado: string
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          empresa_id: string
          estado?: string
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          empresa_id?: string
          estado?: string
          metadata?: Record<string, any>
          updated_at?: string
        }
      },
      company_links: {
        Row: {
          id: string
          empresa_id: string
          slug: string
          type: 'classes' | 'bookings'
          is_active: boolean
          settings: {
            theme?: {
              primary_color?: string
              logo_url?: string
            }
            features?: {
              allow_guest?: boolean
              require_auth?: boolean
              show_prices?: boolean
            }
            restrictions?: {
              max_bookings_per_user?: number
              advance_days?: number
            }
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          slug: string
          type: 'classes' | 'bookings'
          is_active?: boolean
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          empresa_id?: string
          slug?: string
          type?: 'classes' | 'bookings'
          is_active?: boolean
          settings?: Record<string, any>
          updated_at?: string
        }
      },
      sedes: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          address: string | null
          phone: string | null
          manager_id: string | null
          opening_hours: Record<string, any> | null
          is_active: boolean | null
          settings: Record<string, any> | null
          created_at: string | null
          updated_at: string | null
          empresa_id: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          name: string
          address?: string | null
          phone?: string | null
          manager_id?: string | null
          opening_hours?: Record<string, any> | null
          is_active?: boolean | null
          settings?: Record<string, any> | null
          created_at?: string | null
          updated_at?: string | null
          empresa_id: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          name?: string
          address?: string | null
          phone?: string | null
          manager_id?: string | null
          opening_hours?: Record<string, any> | null
          is_active?: boolean | null
          settings?: Record<string, any> | null
          created_at?: string | null
          updated_at?: string | null
          empresa_id?: string
        }
      },
      members: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          gender: string | null
          notes: string | null
          status: string
          created_at: string
          updated_at: string
          branch_id: string | null
          empresa_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['members']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['members']['Row']>
      },
      user_packages: {
        Row: {
          id: string
          user_id: string
          package_id: string
          sessions_left: number
          expires_at: string
          status: 'active' | 'inactive' | 'expired'
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          package_id: string
          sessions_left: number
          expires_at: string
          status?: 'active' | 'inactive' | 'expired'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          package_id?: string
          sessions_left?: number
          expires_at?: string
          status?: 'active' | 'inactive' | 'expired'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 