"use client"

import { useEffect, useMemo, useState } from "react"
import { useAdmin } from "@/components/admin-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { getBookings } from "@/lib/supabase/admin-data"
import type { Database } from "@/types/database"

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"] & {
  booking_items?: { experience_title: string; price: number; quantity: number }[] | null
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
})

const normalizeDate = (value: string | null) => {
  if (!value) return null
  // Normalise to noon UTC to avoid timezone rollover issues.
  return new Date(`${value}T12:00:00.000Z`)
}

export default function BookingsPage() {
  const { supabase } = useAdmin()
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadBookings = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getBookings(supabase)
        if (!isMounted) return
        setBookings(data as BookingRow[])
      } catch (err) {
        console.error("Failed to load bookings", err)
        if (!isMounted) return
        setError("Unable to load bookings. Please try again.")
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    void loadBookings()
    return () => {
      isMounted = false
    }
  }, [supabase])

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [bookings, searchQuery, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700"
      case "pending":
        return "bg-yellow-100 text-yellow-700"
      case "cancelled":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const bookingCount = filteredBookings.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground">
            View and manage all customer bookings ({bookingCount.toLocaleString()} records)
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by booking ID, customer name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[0, 1, 2, 3].map((item) => (
                <Skeleton key={`booking-row-${item}`} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Booking ID</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Experiences</th>
                    <th className="text-left p-4 font-medium">Travel Date</th>
                    <th className="text-left p-4 font-medium">Total</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{booking.id}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{booking.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{booking.customer_email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">
                          {(booking.booking_items?.length ?? 0).toLocaleString()} experience(s)
                        </p>
                      </td>
                      <td className="p-4">
                        {booking.travel_date ? dateFormatter.format(normalizeDate(booking.travel_date)!) : "TBC"}
                      </td>
                      <td className="p-4 font-semibold">{currencyFormatter.format(booking.total_cost)}</td>
                      <td className="p-4">
                        <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                      </td>
                      <td className="p-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Booking {selectedBooking?.id}</DialogTitle>
                              <DialogDescription>Booking details and customer information</DialogDescription>
                            </DialogHeader>
                            {selectedBooking && (
                              <div className="space-y-6">
                                <div>
                                  <h3 className="font-semibold mb-2">Customer Information</h3>
                                  <div className="grid gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Name: </span>
                                      {selectedBooking.customer_name}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Email: </span>
                                      {selectedBooking.customer_email}
                                    </div>
                                    {selectedBooking.customer_phone && (
                                      <div>
                                        <span className="text-muted-foreground">Phone: </span>
                                        {selectedBooking.customer_phone}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-2">Itinerary</h3>
                                  <div className="space-y-2">
                                    {(selectedBooking.booking_items ?? []).map((item, index) => (
                                      <div key={`${item.experience_title}-${index}`} className="flex justify-between">
                                        <span>{item.experience_title}</span>
                                        <span>{currencyFormatter.format(item.price * (item.quantity ?? 1))}</span>
                                      </div>
                                    ))}
                                    {(selectedBooking.booking_items?.length ?? 0) === 0 && (
                                      <p className="text-sm text-muted-foreground">No experiences attached.</p>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Travel Date</Label>
                                    <p className="text-sm">
                                      {selectedBooking.travel_date
                                        ? dateFormatter.format(normalizeDate(selectedBooking.travel_date)!)
                                        : "TBC"}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <p className="capitalize text-sm">{selectedBooking.status}</p>
                                  </div>
                                </div>

                                <div>
                                  <Label>Internal Notes</Label>
                                  <Textarea
                                    placeholder="Add notes about this booking..."
                                    defaultValue={selectedBooking.notes ?? ""}
                                  />
                                </div>

                                <div className="flex justify-end gap-3">
                                  <Button variant="outline">Update Status</Button>
                                  <Button>Save Changes</Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
                        No bookings found for the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
