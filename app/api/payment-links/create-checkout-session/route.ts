import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import type { Database } from "@/types/database";

type PaymentLinkRow = Database["public"]["Tables"]["payment_links"]["Row"];

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const payload = await request.json().catch(() => null);

    if (!payload) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const {
      paymentLinkId,
      firstName,
      lastName,
      email,
      phoneCountryCode,
      phoneNumber,
      travelDate,
      travelers,
      totalAmount,
      notes,
    } = payload;

    // Validate required fields
    if (
      !paymentLinkId ||
      !firstName ||
      !lastName ||
      !email ||
      !phoneCountryCode ||
      !phoneNumber ||
      !travelDate ||
      !travelers ||
      !totalAmount
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get the payment link
    const { data: paymentLink, error: linkError } = await supabase
      .from("payment_links")
      .select("*")
      .eq("id", paymentLinkId)
      .single<PaymentLinkRow>();

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

    // Create payment submission record first
    const submissionData: Database["public"]["Tables"]["payment_submissions"]["Insert"] = {
      payment_link_id: paymentLink.id,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone_country_code: phoneCountryCode,
      phone_number: phoneNumber,
      travel_date: travelDate,
      travelers: travelers,
      notes: notes || null,
      amount: totalAmount,
      currency: paymentLink.currency,
      payment_status: "pending",
      agree_to_terms: true,
    };

    const { data: submission, error: submissionError } = await supabase
      .from("payment_submissions")
      .insert([submissionData])
      .select()
      .single<Database["public"]["Tables"]["payment_submissions"]["Row"]>();

    if (submissionError || !submission) {
      console.error("Failed to create payment submission:", submissionError);
      return NextResponse.json(
        { error: "Failed to create payment submission" },
        { status: 500 }
      );
    }

    // Get origin for URLs
    const origin = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";

    // Create Stripe Checkout Session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: paymentLink.billing_type === "recurring" ? "subscription" : "payment",
      customer_email: email,
      metadata: {
        paymentLinkId: paymentLink.id,
        submissionId: submission.id,
        linkCode: paymentLink.link_code,
        travelDate: travelDate,
        firstName: firstName,
        lastName: lastName,
        phoneCountryCode: phoneCountryCode,
        phoneNumber: phoneNumber,
        notes: notes || "",
        travelers: travelers.toString(),
      },
      success_url: `${origin}/pay/${paymentLink.link_code}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pay/${paymentLink.link_code}?canceled=true`,
    };

    // Add line items based on billing type
    if (paymentLink.billing_type === "one_time") {
      sessionConfig.line_items = [
        {
          price_data: {
            currency: paymentLink.currency.toLowerCase(),
            product_data: {
              name: paymentLink.title,
              description: paymentLink.destination,
              ...(paymentLink.image_url && { images: [paymentLink.image_url] }),
            },
            unit_amount: Math.round(paymentLink.price * 100), // Stripe uses cents
          },
          quantity: travelers,
        },
      ];
    } else {
      // Recurring subscription
      sessionConfig.line_items = [
        {
          price_data: {
            currency: paymentLink.currency.toLowerCase(),
            product_data: {
              name: paymentLink.title,
              description: paymentLink.destination,
              ...(paymentLink.image_url && { images: [paymentLink.image_url] }),
            },
            unit_amount: Math.round(paymentLink.price * 100),
            recurring: {
              interval: (paymentLink.recurring_interval as "month" | "year") || "month",
            },
          },
          quantity: travelers,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Update submission with Stripe session ID
    await supabase
      .from("payment_submissions")
      // @ts-expect-error - Supabase type inference issue
      .update({
        stripe_session_id: session.id
      })
      .eq("id", submission.id);

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error("Unexpected checkout session creation error", error);
    return NextResponse.json({
      error: "Unexpected error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
