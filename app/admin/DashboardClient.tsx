"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Calendar, MapPin } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { DashboardData } from "@/lib/supabase/admin-data"

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

const normalizeDate = (value: string | null) =>
  value ? new Date(`${value}T12:00:00.000Z`) : null

export default function DashboardClient({ data }: { data: DashboardData }) {
  const stats = useMemo(
    () => [
      { title: "Total Revenue", value: currencyFormatter.format(data.metrics.totalRevenue), icon: DollarSign },
      { title: "Total Bookings", value: numberFormatter.format(data.metrics.totalBookings), icon: Calendar },
      { title: "Active Users", value: numberFormatter.format(data.metrics.activeUsers), icon: Users },
      { title: "Total Experiences", value: numberFormatter.format(data.metrics.totalExperiences), icon: MapPin },
    ],
    [data]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your travel booking platform</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Total Users</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[320px]">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <div className="text-4xl font-bold">
            {numberFormatter.format(data.metrics.activeUsers)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Registered users on platform
          </p>
        </CardContent>
      </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Destinations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topDestinations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No destination analytics yet.</p>
            ) : (
              <div className="space-y-4">
                {data.topDestinations.map((dest) => (
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
                    <p className="font-semibold">{currencyFormatter.format(dest.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <div className="space-y-4">
                {data.recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{booking.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.experiences.map((e) => e.title).join(", ") || "Itinerary pending"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.travel_date
                          ? dateFormatter.format(normalizeDate(booking.travel_date)!)
                          : "TBC"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {currencyFormatter.format(booking.total_cost)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {booking.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
