"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Users,
  Package,
  CreditCard,
  FileText,
  Send,
  Save,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Printer
} from "lucide-react";
import type { Database } from "@/types/database";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type BookingItemRow = Database["public"]["Tables"]["booking_items"]["Row"];

interface GroupedItem {
  experience: any;
  package: any;
  items: Array<{
    id: string;
    experience_title: string;
    package_name: string | null;
    tier_type: string | null;
    tier_label: string | null;
    pax_count: number;
    unit_price: number;
    subtotal: number;
    addons: any;
    quantity: number;
    price: number;
  }>;
}

interface BookingDetails extends BookingRow {
  grouped_items: GroupedItem[];
  booking_items: BookingItemRow[];
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bookingStatus, setBookingStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const loadBookingDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/bookings/${bookingId}/details`, {
          method: "GET",
          cache: "no-store"
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("API Error:", errorData);
          throw new Error(errorData.details || errorData.error || "Failed to fetch booking details");
        }

        const data = await res.json();
        // DEBUG: Log received booking data
        console.log("=== BOOKING DETAILS DEBUG ===");
        console.log("Travel Date:", data.booking.travel_date, "Type:", typeof data.booking.travel_date);
        console.log("Number of Adults:", data.booking.number_of_adults);
        console.log("Booking Items:", data.booking.booking_items);
        console.log("============================");
        setBooking(data.booking);
        setBookingStatus(data.booking.booking_status);
        setPaymentStatus(data.booking.payment_status);
        setNotes(data.booking.notes || "");
      } catch (err) {
        console.error("Failed to load booking details", err);
        const errorMessage = err instanceof Error ? err.message : "Unable to load booking details.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      loadBookingDetails();
    }
  }, [bookingId]);

  const handleSaveChanges = async () => {
    if (!booking) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_status: bookingStatus,
          payment_status: paymentStatus,
          notes: notes,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update booking");
      }

      const { booking: updatedBooking } = await res.json();
      setBooking({ ...booking, ...updatedBooking });

      // Show success message (you can add a toast notification here)
      alert("Booking updated successfully!");
    } catch (err) {
      console.error("Failed to update booking", err);
      alert("Failed to update booking. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "paid":
        return "bg-green-100 text-green-700 border-green-200";
      case "unpaid":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "refunded":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", dateString);
        return "Invalid Date";
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/admin/bookings")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bookings
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p className="font-semibold">Error Loading Booking</p>
              </div>
              <p className="text-red-600 text-center text-sm">{error || "Booking not found"}</p>
              {error && error.includes("column") && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 font-medium mb-2">Database Migration Required</p>
                  <p className="text-sm text-yellow-700">
                    It looks like the database columns haven't been added yet. Please run the migration file:
                  </p>
                  <code className="block mt-2 p-2 bg-yellow-100 rounded text-xs">
                    supabase/migrations/20251214_add_booking_package_details.sql
                  </code>
                  <p className="text-sm text-yellow-700 mt-2">
                    See <strong>MIGRATION_INSTRUCTIONS.md</strong> for detailed steps.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPax = (booking.number_of_adults || 0) +
                   (booking.number_of_children || 0) +
                   (booking.number_of_infants || 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/bookings")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Booking Details</h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              {booking.booking_no || `ID: ${booking.id}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Send className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Booking Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Booking Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">{formatDate(booking.booking_date)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Travel Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">{formatDate(booking.travel_date)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Booking Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(booking.booking_status)}
                    <Badge className={getStatusColor(booking.booking_status)}>
                      {booking.booking_status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge className={getStatusColor(booking.payment_status)}>
                    {booking.payment_status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Customer Name</p>
                      <p className="font-medium">{booking.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{booking.customer_email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{booking.customer_phone || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Passengers</p>
                      <p className="font-medium">
                        {totalPax > 0 ? `${totalPax} pax` : "Not specified"}
                        {totalPax > 0 && (
                          <span className="text-sm text-muted-foreground ml-2">
                            ({booking.number_of_adults || 0}A, {booking.number_of_children || 0}C, {booking.number_of_infants || 0}I)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {booking.special_requests && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Special Requests</p>
                    <p className="text-sm bg-muted p-3 rounded-md">{booking.special_requests}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Booked Experiences & Packages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Booked Experiences & Packages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {booking.grouped_items && booking.grouped_items.length > 0 ? (
                booking.grouped_items.map((group: GroupedItem, idx: number) => (
                  <div key={idx} className="space-y-4">
                    {/* Experience Header */}
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <h3 className="font-semibold text-lg">
                            {group.items[0]?.experience_title || "Experience"}
                          </h3>
                          {group.experience && (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {group.experience.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{group.experience.location}, {group.experience.country}</span>
                                </div>
                              )}
                              {group.experience.duration && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>{group.experience.duration}</span>
                                </div>
                              )}
                              {group.experience.category && (
                                <Badge variant="outline" className="mt-2">
                                  {group.experience.category}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Package Details */}
                    {group.package && (
                      <div className="ml-4 pl-4 border-l-2 border-muted space-y-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{group.package.package_name}</span>
                          {group.package.package_code && (
                            <Badge variant="secondary">{group.package.package_code}</Badge>
                          )}
                        </div>
                        {group.package.description && (
                          <p className="text-sm text-muted-foreground">{group.package.description}</p>
                        )}
                        {group.package.inclusions && group.package.inclusions.length > 0 && (
                          <div className="text-sm">
                            <p className="font-medium text-muted-foreground mb-1">Package Inclusions:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                              {group.package.inclusions.map((item: string, i: number) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pricing Breakdown */}
                    <div className="bg-background border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">Tier</th>
                            <th className="text-center p-3 font-medium">Pax</th>
                            <th className="text-right p-3 font-medium">Unit Price</th>
                            <th className="text-right p-3 font-medium">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((item, itemIdx) => (
                            <tr key={itemIdx} className="border-t">
                              <td className="p-3">
                                <div>
                                  <p className="font-medium">
                                    {item.tier_label || item.tier_type || "Standard"}
                                  </p>
                                  {item.tier_type && (
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      {item.tier_type}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-center font-medium">
                                {item.pax_count || item.quantity}
                              </td>
                              <td className="p-3 text-right">
                                {formatCurrency(item.unit_price || item.price)}
                              </td>
                              <td className="p-3 text-right font-semibold">
                                {formatCurrency(item.subtotal || (item.price * (item.pax_count || item.quantity)))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {idx < booking.grouped_items.length - 1 && <Separator />}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No experiences booked</p>
              )}

              {/* Total */}
              <Separator />
              <div className="flex justify-between items-center text-lg font-bold bg-muted/30 p-4 rounded-lg">
                <span>Total Amount</span>
                <span className="text-2xl">{formatCurrency(booking.total_cost)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Experience Details (Meeting Point, What to Bring, etc.) */}
          {booking.grouped_items && booking.grouped_items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Experience Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {booking.grouped_items.map((group: GroupedItem, idx: number) => (
                  group.experience && (
                    <div key={idx} className="space-y-4">
                      <h4 className="font-semibold">{group.items[0]?.experience_title}</h4>

                      {group.experience.meeting_point && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Meeting Point
                          </p>
                          <p className="text-sm bg-muted p-3 rounded-md">{group.experience.meeting_point}</p>
                        </div>
                      )}

                      {group.experience.what_to_bring && group.experience.what_to_bring.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">What to Bring</p>
                          <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                            {group.experience.what_to_bring.map((item: string, i: number) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {group.experience.cancellation_policy && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Cancellation Policy</p>
                          <p className="text-sm bg-muted p-3 rounded-md">{group.experience.cancellation_policy}</p>
                        </div>
                      )}

                      {idx < booking.grouped_items.length - 1 && <Separator />}
                    </div>
                  )
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium">{booking.payment_method}</p>
              </div>
              {booking.payment_reference && (
                <div>
                  <p className="text-sm text-muted-foreground">Payment Reference</p>
                  <p className="font-medium text-sm">{booking.payment_reference}</p>
                </div>
              )}
              {booking.payment_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Payment Date</p>
                  <p className="font-medium">{formatDate(booking.payment_date)}</p>
                </div>
              )}
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(booking.total_cost)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Update Booking Status */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Booking Status</Label>
                <Select value={bookingStatus} onValueChange={setBookingStatus}>
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

              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea
                  placeholder="Add internal notes about this booking..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                />
              </div>

              <Button
                onClick={handleSaveChanges}
                disabled={saving}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(booking.created_at!)}</p>
              </div>
              {booking.updated_at && (
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(booking.updated_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
