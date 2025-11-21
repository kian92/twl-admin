"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/types/database";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"] & {
  experience_items?: { experience_title: string; price: number; quantity: number }[] | null;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [notes, setNotes] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const currency = useMemo(() => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/bookings", { method: "GET", cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch bookings");

        const data = await res.json();
        if (!isMounted) return;

        setBookings(data.bookings);
      } catch (err) {
        console.error("Failed to load bookings", err);
        setError("Unable to load bookings.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadBookings();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customer_email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || booking.payment_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  const getStatusColor = (payment_status: string) => {
    switch (payment_status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(start, start + itemsPerPage);
  }, [filteredBookings, currentPage]);

  const handleSaveChanges = async () => {
    if (!selectedBooking) return;

    const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_status: selectedBooking.payment_status,
        notes: notes,
      }),
    });

    if (!res.ok) {
      console.log("Failed to update booking");
      return;
    }

    const { booking } = await res.json();

    setBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? booking : b))
    );

    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground">
            View and manage all customer bookings ({filteredBookings.length})
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
            <SelectValue placeholder="Filter by payment_status" />
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
                <Skeleton key={item} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-4 text-left">Booking ID</th>
                    <th className="p-4 text-left">Customer</th>
                    <th className="p-4 text-left">Experiences</th>
                    <th className="p-4 text-left">Travel Date</th>
                    <th className="p-4 text-left">Payment Method</th>
                    <th className="p-4 text-left">Total</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{booking.id}</td>

                      <td className="p-4">
                        <p>{booking.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{booking.customer_email}</p>
                      </td>

                      <td className="p-4">
                        {(booking.experience_items?.length ?? 0).toLocaleString()} experience(s)
                      </td>

                      <td className="p-4">{booking.travel_date}</td>
                      <td className="p-4">{booking.payment_method}</td>

                      <td className="p-4 font-semibold">{currency.format(booking.total_cost)}</td>

                      <td className="p-4">
                        <Badge className={getStatusColor(booking.payment_status)}>{booking.payment_status}</Badge>
                      </td>

                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setNotes(booking.notes ?? "");
                            setDialogOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {paginatedBookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        No bookings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationPrevious
                      onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationLink
                        key={page}
                        isActive={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    ))}

                    <PaginationNext
                      onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Booking Details - {selectedBooking?.id}
            </DialogTitle>
            <DialogDescription>Manage booking information</DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-5">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedBooking.customer_name}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedBooking.customer_email}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedBooking.customer_phone}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Travel Date</p>
                  <p className="font-medium">{selectedBooking.travel_date}</p>
                </div>
              </div>

              {/* Experience items */}
              <div>
                <p className="text-muted-foreground font-medium text-sm">Experiences</p>

                <div className="space-y-2">
                  {(selectedBooking.experience_items ?? []).map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between bg-muted px-2 py-3 rounded-md"
                    >
                      <span>{item.experience_title}</span>
                      <span className="font-bold">
                        {currency.format(item.price * (item.quantity ?? 1))}
                      </span>
                    </div>
                  ))}

                  {(selectedBooking.experience_items?.length ?? 0) === 0 && (
                    <p className="text-sm text-muted-foreground">No experiences added.</p>
                  )}

                  <div className="flex justify-between bg-muted px-2 py-3 rounded-md mt-2 font-bold">
                    <span>Total</span>
                    <span>{currency.format(selectedBooking.total_cost)}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedBooking.payment_status}
                  onValueChange={(value) =>
                    setSelectedBooking((prev) =>
                      prev ? { ...prev, payment_status: value } : prev
                    )
                  }
                >
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Add notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button onClick={handleSaveChanges}>Save Changes</Button>
                <Button variant="outline">Send Confirmation Email</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
