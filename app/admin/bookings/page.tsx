"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Download, ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/types/database";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"] & {
  experience_items?: { experience_title: string; price: number; quantity: number }[] | null;
};

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // Default: newest first
  const [isExporting, setIsExporting] = useState(false);

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
    const filtered = bookings.filter((booking) => {
      const matchesSearch =
        booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customer_email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || booking.booking_status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort by created_at (timestamp) instead of booking_date (date only)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || a.booking_date).getTime();
      const dateB = new Date(b.created_at || b.booking_date).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [bookings, searchQuery, statusFilter, sortOrder]);

  const getStatusColor = (booking_status: string) => {
    switch (booking_status) {
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

  const handleViewBooking = (bookingId: string) => {
    router.push(`/admin/bookings/${bookingId}`);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/bookings/export?${params.toString()}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export bookings. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";

      const dateFormatted = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
      const timeFormatted = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
      return `${dateFormatted}, ${timeFormatted}`;
    } catch (error) {
      return "Invalid Date";
    }
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
        <Button variant="outline" onClick={handleExportCSV} disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "Exporting..." : "Export CSV"}
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
                <Skeleton key={item} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-4 text-left">Booking No.</th>
                    <th className="p-4 text-left">Customer</th>
                    <th className="p-4 text-left">
                      <button
                        onClick={toggleSortOrder}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        Booking Date
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="p-4 text-left">Travel Date</th>
                    <th className="p-4 text-left">Payment Method</th>
                    <th className="p-4 text-left">Total</th>
                    <th className="p-4 text-left">Booking Status</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <span className="font-mono font-semibold text-sm">
                          {booking.booking_no || `#${booking.id.substring(0, 8)}`}
                        </span>
                      </td>

                      <td className="p-4">
                        <p>{booking.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{booking.customer_email}</p>
                      </td>

                      <td className="p-4">
                        <span>{formatDateTime(booking.created_at || booking.booking_date)}</span>
                      </td>

                      <td className="p-4">{formatDate(booking.travel_date)}</td>
                      <td className="p-4 capitalize">{booking.payment_method}</td>

                      <td className="p-4 font-semibold">{currency.format(booking.total_cost)}</td>

                      <td className="p-4">
                        <Badge className={getStatusColor(booking.booking_status)}>{booking.booking_status}</Badge>
                      </td>

                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewBooking(booking.id)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {paginatedBookings.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-muted-foreground">
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
    </div>
  );
}
