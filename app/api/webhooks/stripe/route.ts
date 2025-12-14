import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("Checkout session completed:", session.id);

        // Get the submission ID from metadata
        const submissionId = session.metadata?.submissionId;
        if (!submissionId) {
          console.error("No submission ID in session metadata");
          break;
        }

        // Get the payment intent to access the charge
        if (session.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            session.payment_intent as string,
            { expand: ["latest_charge"] }
          );

          const charge = paymentIntent.latest_charge as Stripe.Charge;
          const receiptUrl = charge?.receipt_url || null;

          // Get the submission data to create booking
          const { data: submission, error: fetchError } = await supabase
            .from("payment_submissions")
            .select("*")
            .eq("id", submissionId)
            .single();

          if (fetchError || !submission) {
            console.error("Failed to fetch submission:", fetchError);
          } else {
            // DEBUG: Log submission data
            console.log("=== WEBHOOK DEBUG: Submission Data ===");
            console.log("Travel Date:", submission.travel_date, "Type:", typeof submission.travel_date);
            console.log("Travelers:", submission.travelers, "Type:", typeof submission.travelers);
            console.log("Amount:", submission.amount);
            console.log("====================================");
            // Get payment link details for experience info
            const { data: paymentLink } = await supabase
              .from("payment_links")
              .select("*")
              .eq("id", submission.payment_link_id)
              .single();

            // Create the booking record
            const bookingData: Database["public"]["Tables"]["bookings"]["Insert"] = {
              customer_name: `${submission.first_name} ${submission.last_name}`,
              customer_email: submission.email,
              customer_phone: `${submission.phone_country_code}${submission.phone_number}`,
              booking_date: new Date().toISOString().split('T')[0],
              travel_date: submission.travel_date,
              booking_status: "confirmed",
              payment_status: "paid",
              payment_method: "stripe",
              payment_reference: paymentIntent.id,
              payment_date: new Date().toISOString(),
              total_cost: submission.amount,
              special_requests: submission.notes,
              number_of_adults: submission.travelers, // Assuming all are adults for now
              number_of_children: 0,
              number_of_infants: 0,
              notes: `Created from payment link: ${paymentLink?.title || 'Unknown'}`,
            };

            const { data: booking, error: bookingError } = await supabase
              .from("bookings")
              .insert([bookingData])
              .select()
              .single();

            if (bookingError) {
              console.error("Failed to create booking:", bookingError);
            } else if (booking && paymentLink) {
              console.log("Booking created successfully:", booking.id);
              // DEBUG: Log created booking data
              console.log("=== WEBHOOK DEBUG: Created Booking ===");
              console.log("Booking ID:", booking.id);
              console.log("Booking No:", booking.booking_no);
              console.log("Travel Date:", booking.travel_date, "Type:", typeof booking.travel_date);
              console.log("Number of Adults:", booking.number_of_adults);
              console.log("======================================");

              // Create booking item(s) with proper pax_count
              const bookingItemData: Database["public"]["Tables"]["booking_items"]["Insert"] = {
                booking_id: booking.id,
                experience_id: paymentLink.experience_id,
                experience_title: paymentLink.title,
                price: paymentLink.price,
                quantity: submission.travelers,
                pax_count: submission.travelers, // Set the new pax_count field
                unit_price: paymentLink.price,
                subtotal: paymentLink.price * submission.travelers,
                tier_type: "adult", // Default to adult tier
                tier_label: "Adult",
              };

              const { error: itemError } = await supabase
                .from("booking_items")
                .insert([bookingItemData]);

              if (itemError) {
                console.error("Failed to create booking item:", itemError);
              } else {
                console.log("Booking item created successfully");
                // DEBUG: Log booking item data
                console.log("=== WEBHOOK DEBUG: Booking Item ===");
                console.log("Pax Count:", bookingItemData.pax_count);
                console.log("Quantity:", bookingItemData.quantity);
                console.log("===================================");
              }
            }
          }

          // Update the submission with payment details
          const { error: updateError } = await supabase
            .from("payment_submissions")
            // @ts-expect-error - Supabase type inference issue
            .update({
              payment_status: "paid",
              stripe_payment_intent_id: paymentIntent.id,
              receipt_url: receiptUrl,
            })
            .eq("id", submissionId);

          if (updateError) {
            console.error("Failed to update submission:", updateError);
          } else {
            console.log("Submission updated successfully:", submissionId);
          }

          // Update payment link usage count
          const paymentLinkId = session.metadata?.paymentLinkId;
          if (paymentLinkId) {
            const { error: linkError } = await supabase.rpc(
              "increment_payment_link_uses",
              { link_id: paymentLinkId } as never
            );

            if (linkError) {
              // If RPC doesn't exist, manually increment
              const { data: link } = await supabase
                .from("payment_links")
                .select("current_uses")
                .eq("id", paymentLinkId)
                .single();

              if (link) {
                await supabase
                  .from("payment_links")
                  // @ts-expect-error - Supabase type inference issue
                  .update({ current_uses: link.current_uses + 1 })
                  .eq("id", paymentLinkId);
              }
            }
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const submissionId = session.metadata?.submissionId;
        if (submissionId) {
          await supabase
            .from("payment_submissions")
            // @ts-expect-error - Supabase type inference issue
            .update({
              payment_status: "failed",
            })
            .eq("id", submissionId);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        // Find the submission by payment intent
        const { data: submission } = await supabase
          .from("payment_submissions")
          .select("id")
          .eq("stripe_payment_intent_id", charge.payment_intent as string)
          .single() as { data: { id: string } | null };
        
        if (submission) {
          await supabase
            .from("payment_submissions")
            // @ts-expect-error - Supabase type inference issue
            .update({
              payment_status: "refunded",
            })
            .eq("id", submission.id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
