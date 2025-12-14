import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {

  try {
    const { id: bookingId } = await params;
    const body = await req.json();
    const { booking_status, payment_status, notes } = body;

    const updateData: any = {
      booking_status,
      notes,
      updated_at: new Date().toISOString()
    };

    // Only update payment_status if provided
    if (payment_status !== undefined) {
      updateData.payment_status = payment_status;
    }

    const { data, error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Updated", booking: data }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
