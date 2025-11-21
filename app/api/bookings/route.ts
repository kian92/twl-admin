import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1️⃣ Fetch all bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: false });

    if (bookingsError) {
      return NextResponse.json({ error: bookingsError.message }, { status: 500 });
    }

    // 2️⃣ Fetch all booking items (with name + price)
    const { data: bookingItems, error: itemsError } = await supabase
      .from("booking_items")
      .select("booking_id, experience_title, price, quantity");

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // 3️⃣ Group items by booking_id
    const itemsMap: Record<string, any[]> = {};

    bookingItems.forEach((item) => {
      if (!itemsMap[item.booking_id]) {
        itemsMap[item.booking_id] = [];
      }
      itemsMap[item.booking_id].push({
        experience_title: item.experience_title,
        price: item.price,
        quantity: item.quantity
      });
    });

    // 4️⃣ Attach items + count to each booking
    const bookingsWithExperience = bookings.map((booking) => ({
      ...booking,
      experience_items: itemsMap[booking.id] || [],
      experience_count: itemsMap[booking.id]?.length || 0,
    }));

    return NextResponse.json(
      { bookings: bookingsWithExperience },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
