import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status") || "all";

    // Fetch all bookings with booking items
    let query = supabase
      .from("bookings")
      .select(`
        *,
        booking_items (
          experience_title,
          travel_date,
          quantity,
          pax_count,
          price,
          unit_price,
          subtotal
        )
      `)
      .order("created_at", { ascending: false });

    // Apply status filter if specified
    if (statusFilter !== "all") {
      query = query.eq("booking_status", statusFilter);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error("Failed to fetch bookings:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    // Format data for CSV
    const csvRows: string[] = [];

    // CSV Header
    csvRows.push([
      "Booking No",
      "Booking Date",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Travel Date",
      "Experiences",
      "Total Pax",
      "Adults",
      "Children",
      "Infants",
      "Payment Method",
      "Payment Status",
      "Booking Status",
      "Total Cost",
      "Deposit Amount",
      "Balance Amount",
      "Payment Reference",
      "Special Requests",
      "Created At"
    ].join(","));

    // CSV Data Rows
    for (const booking of bookings || []) {
      const bookingItems = booking.booking_items || [];
      const experiences = bookingItems.map((item: any) => item.experience_title).join("; ");
      const totalPax = (booking.number_of_adults || 0) +
                       (booking.number_of_children || 0) +
                       (booking.number_of_infants || 0);

      // Format dates
      const bookingDate = booking.booking_date || "";
      const travelDate = booking.travel_date || "";
      const createdAt = booking.created_at ? new Date(booking.created_at).toISOString() : "";

      // Escape fields that might contain commas or quotes
      const escapeCSV = (field: any) => {
        if (field === null || field === undefined) return "";
        const str = String(field);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      csvRows.push([
        escapeCSV(booking.booking_no || booking.id.substring(0, 8)),
        escapeCSV(bookingDate),
        escapeCSV(booking.customer_name),
        escapeCSV(booking.customer_email),
        escapeCSV(booking.customer_phone || ""),
        escapeCSV(travelDate),
        escapeCSV(experiences),
        escapeCSV(totalPax),
        escapeCSV(booking.number_of_adults || 0),
        escapeCSV(booking.number_of_children || 0),
        escapeCSV(booking.number_of_infants || 0),
        escapeCSV(booking.payment_method),
        escapeCSV(booking.payment_status),
        escapeCSV(booking.booking_status),
        escapeCSV(booking.total_cost),
        escapeCSV(booking.deposit_amount || 0),
        escapeCSV(booking.balance_amount || 0),
        escapeCSV(booking.payment_reference || ""),
        escapeCSV(booking.special_requests || ""),
        escapeCSV(createdAt)
      ].join(","));
    }

    const csvContent = csvRows.join("\n");

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="bookings-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export bookings" },
      { status: 500 }
    );
  }
}
