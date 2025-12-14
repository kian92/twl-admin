import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // DEBUG: Log booking data from database
    console.log("=== API DEBUG: Booking from DB ===");
    console.log("Travel Date:", booking.travel_date, "Type:", typeof booking.travel_date);
    console.log("Number of Adults:", booking.number_of_adults);
    console.log("================================");

    // Fetch booking items with experience and package details
    const { data: bookingItems, error: itemsError } = await supabase
      .from("booking_items")
      .select(`
        *,
        experiences:experience_id (
          id,
          title,
          slug,
          location,
          country,
          duration,
          category,
          meeting_point,
          cancellation_policy,
          inclusions,
          exclusions,
          what_to_bring
        ),
        experience_packages:package_id (
          id,
          package_name,
          package_code,
          description,
          min_group_size,
          max_group_size,
          inclusions,
          exclusions
        )
      `)
      .eq("booking_id", bookingId);

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    // Group items by experience for better display
    const groupedItems = (bookingItems || []).reduce((acc: any, item: any) => {
      const expId = item.experience_id || 'unknown';

      if (!acc[expId]) {
        acc[expId] = {
          experience: item.experiences,
          package: item.experience_packages,
          items: []
        };
      }

      // DEBUG: Log booking item data
      console.log("=== API DEBUG: Booking Item ===");
      console.log("Pax Count:", item.pax_count, "Type:", typeof item.pax_count);
      console.log("Quantity:", item.quantity);
      console.log("==============================");

      acc[expId].items.push({
        id: item.id,
        experience_title: item.experience_title,
        package_name: item.package_name,
        tier_type: item.tier_type,
        tier_label: item.tier_label,
        pax_count: item.pax_count || item.quantity,
        unit_price: item.unit_price || item.price,
        subtotal: item.subtotal || (item.price * (item.pax_count || item.quantity)),
        addons: item.addons,
        quantity: item.quantity,
        price: item.price
      });

      return acc;
    }, {});

    return NextResponse.json(
      {
        booking: {
          ...booking,
          grouped_items: Object.values(groupedItems),
          booking_items: bookingItems || []
        }
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching booking details:", err);
    return NextResponse.json(
      {
        error: "Server error",
        details: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
}
