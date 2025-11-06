"use client"

import { useState } from "react"
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

// Mock booking data
const mockBookings = [
  {
    id: "BK001",
    bookingDate: "2024-06-15",
    customer: {
      name: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "+1 234 567 8900",
    },
    experiences: [
      { title: "Sunrise at Mount Batur", price: 85 },
      { title: "Cooking Class in Ubud", price: 65 },
    ],
    totalCost: 150,
    status: "confirmed",
    travelDate: "2024-07-20",
    notes: "",
  },
  {
    id: "BK002",
    bookingDate: "2024-06-14",
    customer: {
      name: "Mike Chen",
      email: "mike@example.com",
      phone: "+1 234 567 8901",
    },
    experiences: [{ title: "Tokyo Food & Culture Walking Tour", price: 75 }],
    totalCost: 75,
    status: "pending",
    travelDate: "2024-08-05",
    notes: "Vegetarian meal preference",
  },
  {
    id: "BK003",
    bookingDate: "2024-06-13",
    customer: {
      name: "Emma Wilson",
      email: "emma@example.com",
      phone: "+1 234 567 8902",
    },
    experiences: [
      { title: "Santorini Sunset Sailing", price: 110 },
      { title: "Athens Acropolis & City Tour", price: 70 },
    ],
    totalCost: 180,
    status: "confirmed",
    travelDate: "2024-09-10",
    notes: "",
  },
  {
    id: "BK004",
    bookingDate: "2024-06-12",
    customer: {
      name: "David Lee",
      email: "david@example.com",
      phone: "+1 234 567 8903",
    },
    experiences: [{ title: "Bangkok Street Food Tour", price: 45 }],
    totalCost: 45,
    status: "cancelled",
    travelDate: "2024-07-15",
    notes: "Customer requested cancellation",
  },
  {
    id: "BK005",
    bookingDate: "2024-06-11",
    customer: {
      name: "Lisa Anderson",
      email: "lisa@example.com",
      phone: "+1 234 567 8904",
    },
    experiences: [
      { title: "Mount Fuji & Hakone Day Trip", price: 135 },
      { title: "Kyoto Temples & Bamboo Forest", price: 95 },
    ],
    totalCost: 230,
    status: "confirmed",
    travelDate: "2024-10-01",
    notes: "",
  },
]

export default function BookingsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<(typeof mockBookings)[0] | null>(null)

  const filteredBookings = mockBookings.filter((booking) => {
    const matchesSearch =
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground">View and manage all customer bookings</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
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

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
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
                        <p className="font-medium">{booking.customer.name}</p>
                        <p className="text-sm text-muted-foreground">{booking.customer.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{booking.experiences.length} experience(s)</p>
                    </td>
                    <td className="p-4">{booking.travelDate}</td>
                    <td className="p-4 font-semibold">${booking.totalCost}</td>
                    <td className="p-4">
                      <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                    </td>
                    <td className="p-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedBooking(booking)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Booking Details - {booking.id}</DialogTitle>
                            <DialogDescription>View and manage booking information</DialogDescription>
                          </DialogHeader>
                          {selectedBooking && (
                            <div className="space-y-6">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <Label className="text-muted-foreground">Customer Name</Label>
                                  <p className="font-medium">{selectedBooking.customer.name}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Email</Label>
                                  <p className="font-medium">{selectedBooking.customer.email}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Phone</Label>
                                  <p className="font-medium">{selectedBooking.customer.phone}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Travel Date</Label>
                                  <p className="font-medium">{selectedBooking.travelDate}</p>
                                </div>
                              </div>

                              <div>
                                <Label className="text-muted-foreground mb-2 block">Experiences</Label>
                                <div className="space-y-2">
                                  {selectedBooking.experiences.map((exp, idx) => (
                                    <div key={idx} className="flex justify-between p-3 bg-muted rounded-lg">
                                      <span>{exp.title}</span>
                                      <span className="font-semibold">${exp.price}</span>
                                    </div>
                                  ))}
                                  <div className="flex justify-between p-3 bg-primary/10 rounded-lg font-bold">
                                    <span>Total</span>
                                    <span>${selectedBooking.totalCost}</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="status">Update Status</Label>
                                <Select defaultValue={selectedBooking.status}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                  id="notes"
                                  placeholder="Add notes about this booking..."
                                  defaultValue={selectedBooking.notes}
                                  rows={3}
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button>Save Changes</Button>
                                <Button variant="outline">Send Confirmation Email</Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No bookings found matching your criteria</p>
        </div>
      )}
    </div>
  )
}
