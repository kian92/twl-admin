"use client"

import { useEffect, useMemo, useState } from "react"
import { useAdmin } from "@/components/admin-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, Users, Calendar, MapPin } from "lucide-react"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { getDashboardData, type DashboardData } from "@/lib/supabase/admin-data"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
})

const normalizeDate = (value: string | null) => {
  if (!value) return null
  return new Date(`${value}T12:00:00.000Z`)
}

export default function AdminDashboard() {
  const { supabase } = useAdmin()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout

    const loadData = async () => {
      setLoading(true)
      setError(null)

      // Set a timeout to stop loading after 10 seconds
      timeoutId = setTimeout(() => {
        if (isMounted && loading) {
          console.warn("Dashboard data loading timed out")
          setLoading(false)
          setError("Dashboard is taking longer than expected. Showing empty state.")
          setData({
            metrics: {
              totalRevenue: 0,
              totalBookings: 0,
              activeUsers: 0,
              totalExperiences: 0,
            },
            bookingTrend: [],
            revenueTrend: [],
            topDestinations: [],
            recentBookings: [],
          })
        }
      }, 10000)

      try {
        const response = await getDashboardData(supabase)
        if (!isMounted) return
        clearTimeout(timeoutId)
        setData(response)
        setError(null)
      } catch (err) {
        console.error("Failed to load dashboard data", err)
        if (!isMounted) return
        clearTimeout(timeoutId)
        setError("Unable to load dashboard data. Showing empty state.")
        // Set empty data instead of null
        setData({
          metrics: {
            totalRevenue: 0,
            totalBookings: 0,
            activeUsers: 0,
            totalExperiences: 0,
          },
          bookingTrend: [],
          revenueTrend: [],
          topDestinations: [],
          recentBookings: [],
        })
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [supabase])

  const stats = useMemo(() => {
    if (!data) {
      return [
        {
          title: "Total Revenue",
          value: currencyFormatter.format(0),
          icon: DollarSign,
        },
        {
          title: "Total Bookings",
          value: numberFormatter.format(0),
          icon: Calendar,
        },
        {
          title: "Active Users",
          value: numberFormatter.format(0),
          icon: Users,
        },
        {
          title: "Total Experiences",
          value: numberFormatter.format(0),
          icon: MapPin,
        },
      ]
    }
    return [
      {
        title: "Total Revenue",
        value: currencyFormatter.format(data.metrics.totalRevenue ?? 0),
        icon: DollarSign,
      },
      {
        title: "Total Bookings",
        value: numberFormatter.format(data.metrics.totalBookings ?? 0),
        icon: Calendar,
      },
      {
        title: "Active Users",
        value: numberFormatter.format(data.metrics.activeUsers ?? 0),
        icon: Users,
      },
      {
        title: "Total Experiences",
        value: numberFormatter.format(data.metrics.totalExperiences ?? 0),
        icon: MapPin,
      },
    ]
  }, [data])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your travel booking platform</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading &&
          [0, 1, 2, 3].map((item) => (
            <Card key={`stat-skeleton-${item}`}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-32" />
              </CardContent>
            </Card>
          ))}

        {!loading &&
          stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.bookingTrend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.revenueTrend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3].map((item) => (
                  <div key={`dest-skeleton-${item}`} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(data?.topDestinations ?? []).map((dest) => (
                  <div key={dest.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-coral-500 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{dest.country}</p>
                        <p className="text-sm text-muted-foreground">
                          {numberFormatter.format(dest.bookings)} bookings
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">{currencyFormatter.format(dest.revenue ?? 0)}</p>
                  </div>
                ))}
                {(data?.topDestinations?.length ?? 0) === 0 && (
                  <p className="text-sm text-muted-foreground">No destination analytics yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3].map((item) => (
                  <div key={`booking-skeleton-${item}`} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(data?.recentBookings ?? []).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{booking.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.experiences.map((item) => item.title).join(", ") || "Itinerary pending"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.travel_date ? dateFormatter.format(normalizeDate(booking.travel_date)!) : "TBC"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{currencyFormatter.format(booking.total_cost ?? 0)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{booking.status}</p>
                    </div>
                  </div>
                ))}
                {(data?.recentBookings?.length ?? 0) === 0 && (
                  <p className="text-sm text-muted-foreground">No bookings yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
