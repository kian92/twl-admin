import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const payload = await request.json().catch(() => null);

    if (!payload) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { paymentLinkId, firstName, lastName, email, phone, travelDate, travelers, totalAmount, notes, paymentMethod } = payload;

    // Validate required fields
    if (!paymentLinkId || !firstName || !lastName || !email || !phone || !travelDate || !travelers || !totalAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get the payment link
    const { data: paymentLink, error: linkError } = await supabase
      .from("payment_links")
      .select("*")
      .eq("id", paymentLinkId)
      .single() as { data: any; error: any };

    if (linkError || !paymentLink) {
      return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
    }

    // Check if link is active
    if (paymentLink.status !== "active") {
      return NextResponse.json({ error: "Payment link is not active" }, { status: 400 });
    }

    // Check if expired
    if (paymentLink.expires_at && new Date(paymentLink.expires_at) < new Date()) {
      return NextResponse.json({ error: "Payment link has expired" }, { status: 400 });
    }

    // Check max uses
    if (paymentLink.max_uses && paymentLink.current_uses >= paymentLink.max_uses) {
      return NextResponse.json({ error: "Payment link has reached maximum uses" }, { status: 400 });
    }

    // Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        customer_name: `${firstName} ${lastName}`,
        customer_email: email,
        customer_phone: phone,
        travel_date: travelDate,
        booking_status: "confirmed",
        payment_status: paymentMethod === "pay-later" ? "pending" : "paid",
        payment_method: paymentMethod,
        total_cost: totalAmount,
        notes: notes || null,
      } as any)
      .select()
      .single() as { data: any; error: any };

    if (bookingError) {
      console.error("Failed to create booking", bookingError);
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    // Create booking item
    await supabase.from("booking_items").insert({
      booking_id: booking.id,
      experience_title: paymentLink.title,
      price: paymentLink.price,
      quantity: travelers,
    } as any);

    // Increment payment link usage
    await supabase
      .from("payment_links")
      // @ts-expect-error - Supabase type inference issue
      .update({
        current_uses: paymentLink.current_uses + 1,
      })
      .eq("id", paymentLinkId);

    // TODO: Send confirmation email
    // TODO: Process actual payment if not pay-later

    return NextResponse.json({ success: true, bookingId: booking.id });
  } catch (error) {
    console.error("Unexpected checkout error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
