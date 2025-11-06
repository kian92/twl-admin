"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Calendar, MapPin } from "lucide-react"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Mock data for dashboard
const stats = [
  {
    title: "Total Revenue",
    value: "$45,231",
    change: "+20.1% from last month",
    icon: DollarSign,
    trend: "up",
  },
  {
    title: "Total Bookings",
    value: "573",
    change: "+12.5% from last month",
    icon: Calendar,
    trend: "up",
  },
  {
    title: "Active Users",
    value: "2,350",
    change: "+8.2% from last month",
    icon: Users,
    trend: "up",
  },
  {
    title: "Total Experiences",
    value: "18",
    change: "+2 new this month",
    icon: MapPin,
    trend: "up",
  },
]

const bookingTrend = [
  { date: "Jan", bookings: 45 },
  { date: "Feb", bookings: 52 },
  { date: "Mar", bookings: 61 },
  { date: "Apr", bookings: 58 },
  { date: "May", bookings: 70 },
  { date: "Jun", bookings: 85 },
]

const revenueTrend = [
  { date: "Jan", revenue: 3200 },
  { date: "Feb", revenue: 3800 },
  { date: "Mar", revenue: 4200 },
  { date: "Apr", revenue: 4100 },
  { date: "May", revenue: 5200 },
  { date: "Jun", revenue: 6500 },
]

const topDestinations = [
  { name: "Indonesia", bookings: 245, revenue: "$18,450" },
  { name: "Thailand", bookings: 189, revenue: "$14,230" },
  { name: "Japan", bookings: 98, revenue: "$9,850" },
  { name: "Greece", bookings: 41, revenue: "$2,701" },
]

const recentBookings = [
  {
    id: "BK123",
    customer: "Sarah Johnson",
    experience: "Sunrise at Mount Batur",
    date: "2024-06-15",
    amount: "$85",
    status: "confirmed",
  },
  {
    id: "BK124",
    customer: "Mike Chen",
    experience: "Tokyo Food Tour",
    date: "2024-06-14",
    amount: "$75",
    status: "confirmed",
  },
  {
    id: "BK125",
    customer: "Emma Wilson",
    experience: "Santorini Sunset Sailing",
    date: "2024-06-14",
    amount: "$110",
    status: "pending",
  },
  {
    id: "BK126",
    customer: "David Lee",
    experience: "Bangkok Street Food Tour",
    date: "2024-06-13",
    amount: "$45",
    status: "confirmed",
  },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your travel booking platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bookingTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Destinations and Recent Bookings */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topDestinations.map((dest) => (
                <div key={dest.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-coral-500 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{dest.name}</p>
                      <p className="text-sm text-muted-foreground">{dest.bookings} bookings</p>
                    </div>
                  </div>
                  <p className="font-semibold">{dest.revenue}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{booking.customer}</p>
                    <p className="text-sm text-muted-foreground">{booking.experience}</p>
                    <p className="text-xs text-muted-foreground">{booking.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{booking.amount}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
