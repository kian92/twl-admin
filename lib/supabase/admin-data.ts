import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type PublicClient = SupabaseClient<Database>

export interface DashboardData {
  metrics: {
    totalRevenue: number
    totalBookings: number
    activeUsers: number
    totalExperiences: number
  }
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
}

type DashboardMetricsRow =
  Database["public"]["Functions"]["admin_dashboard_metrics"]["Returns"]

type RevenueTrendRow =
  Database["public"]["Functions"]["revenue_trend"]["Returns"][number]

type TopDestinationRow =
  Database["public"]["Functions"]["top_destinations"]["Returns"][number]

type RecentBookingRow =
  Database["public"]["Tables"]["bookings"]["Row"] & {
    booking_items?: BookingItem[] | null
  }

export async function getDashboardData(
  supabase: PublicClient
): Promise<DashboardData> {
  const [
    metricsRes,
    revenueTrendRes,
    topDestinationsRes,
    recentBookingsRes,
  ] = await Promise.all([
    supabase.rpc("admin_dashboard_metrics"),
    supabase.rpc("revenue_trend", { months: 6 } as never),
    supabase.rpc("top_destinations", { limit_val: 4 } as never),
    supabase
      .from("bookings")
      .select(
        "id, customer_name, travel_date, total_cost, booking_status, booking_items:booking_items(experience_title)"
      )
      .order("booking_date", { ascending: false })
      .limit(6),
  ])

  const metrics =
    (metricsRes.data as DashboardMetricsRow[] | null)?.[0] ?? {
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
    revenueTrend:
      (revenueTrendRes.data as RevenueTrendRow[] | null)?.map((r) => ({
        month: r.month,
        revenue: r.revenue,
      })) ?? [],
    topDestinations:
      (topDestinationsRes.data as TopDestinationRow[] | null)?.map((d) => ({
        country: d.country,
        bookings: d.booking_count,
        revenue: d.revenue,
      })) ?? [],
    recentBookings:
      (recentBookingsRes.data as RecentBookingRow[] | null)?.map((b) => ({
        id: b.id,
        customer_name: b.customer_name,
        travel_date: b.travel_date,
        total_cost: b.total_cost,
        status: b.booking_status,
        experiences:
          b.booking_items?.map((i) => ({ title: i.experience_title })) ?? [],
      })) ?? [],
  }
}
