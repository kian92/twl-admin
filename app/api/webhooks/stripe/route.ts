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
