import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type PublicClient = SupabaseClient<Database>

export interface DashboardMetric {
  title: string
  value: number
}

export interface DashboardData {
  metrics: {
    totalRevenue: number
    totalBookings: number
    activeUsers: number
    totalExperiences: number
  }
  bookingTrend: { month: string; bookings: number }[]
  revenueTrend: { month: string; revenue: number }[]
  topDestinations: { country: string; bookings: number; revenue: number }[]
  recentBookings: {
    id: string
    customer_name: string
    travel_date: string
    total_cost: number
    status: string
    experiences: { title: string }[]
  }[]
}

type BookingItem = {
  experience_title: string
  price?: number
  quantity?: number
}

type DashboardMetricsRow = Database["public"]["Functions"]["admin_dashboard_metrics"]["Returns"]
type BookingTrendRow = Database["public"]["Functions"]["booking_trend"]["Returns"][number]
type RevenueTrendRow = Database["public"]["Functions"]["revenue_trend"]["Returns"][number]
type TopDestinationRow = Database["public"]["Functions"]["top_destinations"]["Returns"][number]
type RecentBookingRow = Database["public"]["Tables"]["bookings"]["Row"] & {
  booking_items?: BookingItem[] | null
}

export async function getDashboardData(supabase: PublicClient): Promise<DashboardData> {
  const [metricsRes, bookingTrendRes, revenueTrendRes, topDestinationsRes, recentBookingsRes] = await Promise.all([
    supabase.rpc("admin_dashboard_metrics"),
    supabase.rpc("booking_trend", { months: 6 } as never),
    supabase.rpc("revenue_trend", { months: 6 } as never),
    supabase.rpc("top_destinations", { limit_val: 4 } as never),
    supabase
      .from("bookings")
      .select(
        "id, customer_name, travel_date, total_cost, status, booking_items:booking_items(experience_title, price, quantity)",
      )
      .order("booking_date", { ascending: false })
      .limit(6),
  ])

  if (metricsRes.error) {
    throw metricsRes.error
  }
  if (bookingTrendRes.error) {
    throw bookingTrendRes.error
  }
  if (revenueTrendRes.error) {
    throw revenueTrendRes.error
  }
  if (topDestinationsRes.error) {
    throw topDestinationsRes.error
  }
  if (recentBookingsRes.error) {
    throw recentBookingsRes.error
  }

  const bookingTrendData = (bookingTrendRes.data ?? []) as BookingTrendRow[]
  const bookingTrend = bookingTrendData.map((point) => ({
    month: point.month,
    bookings: point.booking_count,
  }))

  const revenueTrendData = (revenueTrendRes.data ?? []) as RevenueTrendRow[]
  const revenueTrend = revenueTrendData.map((point) => ({
    month: point.month,
    revenue: point.revenue,
  }))

  const topDestinationsData = (topDestinationsRes.data ?? []) as TopDestinationRow[]
  const topDestinations = topDestinationsData.map((row) => ({
    country: row.country,
    bookings: row.booking_count,
    revenue: row.revenue,
  }))

  const recentBookingsData = (recentBookingsRes.data ?? []) as RecentBookingRow[]
  const recentBookings = recentBookingsData.map((booking) => ({
    id: booking.id,
    customer_name: booking.customer_name,
    travel_date: booking.travel_date,
    total_cost: booking.total_cost,
    status: booking.status,
    experiences:
      booking.booking_items?.map((item) => ({
        title: item.experience_title,
      })) ?? [],
  }))

  const metrics = (metricsRes.data as DashboardMetricsRow | null) ?? {
    total_revenue: 0,
    total_bookings: 0,
    active_users: 0,
    total_experiences: 0,
  }

  return {
    metrics: {
      totalRevenue: metrics.total_revenue ?? 0,
      totalBookings: metrics.total_bookings ?? 0,
      activeUsers: metrics.active_users ?? 0,
      totalExperiences: metrics.total_experiences ?? 0,
    },
    bookingTrend,
    revenueTrend,
    topDestinations,
    recentBookings,
  }
}

export async function getBookings(supabase: PublicClient) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, customer_name, customer_email, customer_phone, booking_date, travel_date, status, total_cost, notes, booking_items:booking_items(experience_title, price, quantity)",
    )
    .order("booking_date", { ascending: false })

  if (error) {
    throw error
  }
  return data ?? []
}

export async function getCustomers(supabase: PublicClient) {
  const { data, error } = await supabase
    .from("customer_profiles")
    .select(
      "id, full_name, email, membership_tier, points_balance, total_bookings, total_spent, status, joined_at, avatar_url",
    )
    .order("joined_at", { ascending: false })

  if (error) {
    throw error
  }
  return data ?? []
}

export async function getMembershipTiers(supabase: PublicClient) {
  const { data, error } = await supabase
    .from("membership_tiers")
    .select("id, name, gradient_from, gradient_to, discount_rate, referral_bonus_points, free_addons_value, member_count")
    .order("discount_rate", { ascending: true })

  if (error) {
    throw error
  }
  return data ?? []
}

export async function getRewardSettings(supabase: PublicClient) {
  const { data, error } = await supabase.from("reward_settings").select("id, key, value").order("key", { ascending: true })
  if (error) {
    throw error
  }
  return data ?? []
}

export async function getRewardCampaigns(supabase: PublicClient) {
  const { data, error } = await supabase
    .from("reward_campaigns")
    .select("id, name, description, multiplier, status, ends_at")
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }
  return data ?? []
}
