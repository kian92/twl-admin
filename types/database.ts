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
      admin_profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          full_name?: string | null
          role?: string | null
          avatar_url?: string | null
          is_active?: boolean
          updated_at?: string | null
        }
      }
      experiences: {
        Row: {
          id: string
          title: string
          location: string
          country: string
          duration: string
          price: number
          category: string
          image_url: string | null
          rating: number | null
          review_count: number | null
          description: string | null
          highlights: string[] | null
          inclusions: string[] | null
          exclusions: string[] | null
          not_suitable_for: string[] | null
          meeting_point: string | null
          what_to_bring: string[] | null
          cancellation_policy: string | null
          itinerary: Json | null
          gallery: string[] | null
          faqs: Json | null
          created_at: string | null
          updated_at: string | null
          status: "active" | "draft" | "deleted"
        }
        Insert: {
          id?: string
          title: string
          location: string
          country: string
          duration: string
          price: number
          category: string
          image_url?: string | null
          rating?: number | null
          review_count?: number | null
          description?: string | null
          highlights?: string[] | null
          inclusions?: string[] | null
          exclusions?: string[] | null
          not_suitable_for?: string[] | null
          meeting_point?: string | null
          what_to_bring?: string[] | null
          cancellation_policy?: string | null
          itinerary?: Json | null
          gallery?: string[] | null
          faqs?: Json | null
          created_at?: string | null
          updated_at?: string | null
          status: "active" | "draft" | "deleted"
        }
        Update: {
          title?: string
          location?: string
          country?: string
          duration?: string
          price?: number
          category?: string
          image_url?: string | null
          rating?: number | null
          review_count?: number | null
          description?: string | null
          highlights?: string[] | null
          inclusions?: string[] | null
          exclusions?: string[] | null
          not_suitable_for?: string[] | null
          meeting_point?: string | null
          what_to_bring?: string[] | null
          cancellation_policy?: string | null
          itinerary?: Json | null
          gallery?: string[] | null
          faqs?: Json | null
          updated_at?: string | null
          status: "active" | "draft" | "deleted"
        }
      }
      bookings: {
        Row: {
          id: string
          customer_name: string
          customer_email: string
          customer_phone: string | null
          booking_date: string
          travel_date: string
          status: string
          total_cost: number
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          booking_date?: string
          travel_date: string
          status: string
          total_cost: number
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          booking_date?: string
          travel_date?: string
          status?: string
          total_cost?: number
          notes?: string | null
          updated_at?: string | null
        }
      }
      booking_items: {
        Row: {
          id: string
          booking_id: string
          experience_id: string | null
          experience_title: string
          price: number
          quantity: number
          created_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          experience_id?: string | null
          experience_title: string
          price: number
          quantity?: number
          created_at?: string | null
        }
        Update: {
          booking_id?: string
          experience_id?: string | null
          experience_title?: string
          price?: number
          quantity?: number
        }
      }
      customer_profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          membership_tier: string
          points_balance: number
          total_bookings: number
          total_spent: number
          status: string
          joined_at: string
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name: string
          email: string
          membership_tier: string
          points_balance?: number
          total_bookings?: number
          total_spent?: number
          status?: string
          joined_at?: string
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          full_name?: string
          email?: string
          membership_tier?: string
          points_balance?: number
          total_bookings?: number
          total_spent?: number
          status?: string
          joined_at?: string
          avatar_url?: string | null
          updated_at?: string | null
        }
      }
      membership_tiers: {
        Row: {
          id: string
          name: string
          gradient_from: string
          gradient_to: string
          discount_rate: number
          referral_bonus_points: number
          free_addons_value: string | null
          member_count: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          gradient_from: string
          gradient_to: string
          discount_rate: number
          referral_bonus_points: number
          free_addons_value?: string | null
          member_count?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          name?: string
          gradient_from?: string
          gradient_to?: string
          discount_rate?: number
          referral_bonus_points?: number
          free_addons_value?: string | null
          member_count?: number
          updated_at?: string | null
        }
      }
      reward_settings: {
        Row: {
          id: string
          key: string
          value: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          key: string
          value: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          key?: string
          value?: string
          updated_at?: string | null
        }
      }
      reward_campaigns: {
        Row: {
          id: string
          name: string
          description: string | null
          multiplier: number | null
          status: string
          ends_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          multiplier?: number | null
          status: string
          ends_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          multiplier?: number | null
          status?: string
          ends_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      admin_dashboard_metrics: {
        Args: { start_date?: string | null }
        Returns: {
          total_revenue: number
          total_bookings: number
          active_users: number
          total_experiences: number
        }
      }
      booking_trend: {
        Args: { months?: number | null }
        Returns: { month: string; booking_count: number }[]
      }
      revenue_trend: {
        Args: { months?: number | null }
        Returns: { month: string; revenue: number }[]
      }
      top_destinations: {
        Args: { limit_val?: number | null }
        Returns: { country: string; booking_count: number; revenue: number }[]
      }
    }
  }
}
