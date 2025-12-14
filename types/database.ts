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
          role: "admin" | "manager" | "support" | "sales" | "supplier" | null
          avatar_url: string | null
          is_active: boolean
          company_name: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: "admin" | "manager" | "support" | "sales" | "supplier" | null
          avatar_url?: string | null
          is_active?: boolean
          company_name?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          full_name?: string | null
          role?: "admin" | "manager" | "support" | "sales" | "supplier" | null
          avatar_url?: string | null
          is_active?: boolean
          company_name?: string | null
          updated_at?: string | null
        }
      }
      experiences: {
        Row: {
          slug: string
          id: string
          title: string
          location: string
          country: string
          duration: string
          price: number
          adult_price: number
          child_price: number
          available_from: string | null
          available_to: string | null
          min_group_size: number
          max_group_size: number | null
          category: string
          // image_url: string | null
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
          is_destination_featured: boolean
          status: "draft" | "review" | "active"
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          slug: string
          id?: string
          title: string
          location: string
          country: string
          duration: string
          price: number
          adult_price: number
          child_price: number
          available_from?: string | null
          available_to?: string | null
          min_group_size?: number
          max_group_size?: number | null
          category: string
          // image_url?: string | null
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
          is_destination_featured?: boolean
          status?: "draft" | "review" | "active"
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          slug?: string
          title?: string
          location?: string
          country?: string
          duration?: string
          price?: number
          adult_price?: number
          child_price?: number
          available_from?: string | null
          available_to?: string | null
          min_group_size?: number
          max_group_size?: number | null
          category?: string
          // image_url?: string | null
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
          is_destination_featured?: boolean
          status?: "draft" | "review" | "active"
          gallery?: string[] | null
          faqs?: Json | null
          created_by?: string | null
          updated_at?: string | null
        }
      }
      bookings: {
        Row: {
          id: string
          booking_no: string | null
          customer_name: string
          customer_email: string
          customer_phone: string | null
          booking_date: string
          travel_date: string
          booking_status: string
          payment_status: string
          payment_method: string
          total_cost: number
          notes: string | null
          payment_reference: string | null
          payment_date: string | null
          special_requests: string | null
          number_of_adults: number | null
          number_of_children: number | null
          number_of_infants: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          booking_no?: string | null
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          booking_date?: string
          travel_date: string
          booking_status: string
          payment_status: string
          payment_method: string
          total_cost: number
          notes?: string | null
          payment_reference?: string | null
          payment_date?: string | null
          special_requests?: string | null
          number_of_adults?: number | null
          number_of_children?: number | null
          number_of_infants?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_no?: string | null
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          booking_date?: string
          travel_date?: string
          booking_status?: string
          payment_status?: string
          payment_method?: string
          total_cost?: number
          notes?: string | null
          payment_reference?: string | null
          payment_date?: string | null
          special_requests?: string | null
          number_of_adults?: number | null
          number_of_children?: number | null
          number_of_infants?: number | null
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
          package_id: string | null
          package_name: string | null
          tier_type: string | null
          tier_label: string | null
          pax_count: number | null
          unit_price: number | null
          subtotal: number | null
          addons: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          experience_id?: string | null
          experience_title: string
          price: number
          quantity?: number
          package_id?: string | null
          package_name?: string | null
          tier_type?: string | null
          tier_label?: string | null
          pax_count?: number | null
          unit_price?: number | null
          subtotal?: number | null
          addons?: Json | null
          created_at?: string | null
        }
        Update: {
          booking_id?: string
          experience_id?: string | null
          experience_title?: string
          price?: number
          quantity?: number
          package_id?: string | null
          package_name?: string | null
          tier_type?: string | null
          tier_label?: string | null
          pax_count?: number | null
          unit_price?: number | null
          subtotal?: number | null
          addons?: Json | null
        }
      }
      customer_profiles: {
        Row: {
          id: string
          name: string
          email: string
          membershipTier: string
          points: number
          total_bookings: number
          total_spent: number
          status: string
          joinedDate: string
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          email: string
          membershipTier: string
          points_balance?: number
          total_bookings?: number
          total_spent?: number
          status?: string
          joinedDate?: string
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          name?: string
          email?: string
          membershipTier?: string
          points_balance?: number
          total_bookings?: number
          total_spent?: number
          status?: string
          joinedDate?: string
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
      payment_links: {
        Row: {
          id: string
          title: string
          description: string | null
          destination: string
          destination_description: string | null
          price: number
          currency: string
          link_code: string
          status: string
          created_by: string
          expires_at: string | null
          max_uses: number | null
          current_uses: number
          custom_fields: Json | null
          image_url: string | null
          billing_type: string
          recurring_interval: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          destination: string
          destination_description?: string | null
          price: number
          currency?: string
          link_code: string
          status?: string
          created_by: string
          expires_at?: string | null
          max_uses?: number | null
          current_uses?: number
          custom_fields?: Json | null
          image_url?: string | null
          billing_type?: string
          recurring_interval?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          destination?: string
          destination_description?: string | null
          price?: number
          currency?: string
          status?: string
          expires_at?: string | null
          max_uses?: number | null
          current_uses?: number
          custom_fields?: Json | null
          image_url?: string | null
          billing_type?: string
          recurring_interval?: string | null
          updated_at?: string | null
        }
      }
      payment_submissions: {
        Row: {
          id: string
          payment_link_id: string
          stripe_session_id: string | null
          stripe_payment_intent_id: string | null
          first_name: string
          last_name: string
          email: string
          phone_country_code: string
          phone_number: string
          travel_date: string
          travelers: number
          notes: string | null
          amount: number
          currency: string
          payment_status: string
          receipt_url: string | null
          agree_to_terms: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          payment_link_id: string
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          first_name: string
          last_name: string
          email: string
          phone_country_code?: string
          phone_number: string
          travel_date: string
          travelers?: number
          notes?: string | null
          amount: number
          currency?: string
          payment_status?: string
          receipt_url?: string | null
          agree_to_terms?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          first_name?: string
          last_name?: string
          email?: string
          phone_country_code?: string
          phone_number?: string
          travel_date?: string
          travelers?: number
          notes?: string | null
          amount?: number
          currency?: string
          payment_status?: string
          receipt_url?: string | null
          agree_to_terms?: boolean
          updated_at?: string | null
        }
      }
      testimonials: {
        Row: {
          id: string
          author_name: string
          author_location: string | null
          tour_name: string | null
          tour_date: string | null
          content: string
          platform: "instagram" | "facebook" | "twitter" | "google" | "website" | "email" | "other" | null
          social_media_url: string | null
          image_url: string | null
          is_featured: boolean
          is_active: boolean
          display_order: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          author_name: string
          author_location?: string | null
          tour_name?: string | null
          tour_date?: string | null
          content: string
          platform?: "instagram" | "facebook" | "twitter" | "google" | "website" | "email" | "other" | null
          social_media_url?: string | null
          image_url?: string | null
          is_featured?: boolean
          is_active?: boolean
          display_order?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          author_name?: string
          author_location?: string | null
          tour_name?: string | null
          tour_date?: string | null
          content?: string
          platform?: "instagram" | "facebook" | "twitter" | "google" | "website" | "email" | "other" | null
          social_media_url?: string | null
          image_url?: string | null
          is_featured?: boolean
          is_active?: boolean
          display_order?: number
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
