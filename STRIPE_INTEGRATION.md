# Stripe Integration Guide for Payment Links

This guide will help you integrate Stripe with your custom payment links system, supporting both one-time payments and recurring subscriptions.

## Features

- ✅ **Custom Payment Links** - Create personalized payment links with your own domain
- ✅ **One-time Payments** - Single payment for experiences
- ✅ **Recurring Subscriptions** - Monthly or yearly recurring payments
- ✅ **Automatic Invoice Management** - Stripe handles all invoicing
- ✅ **No Manual Stripe Dashboard Setup** - Everything is created programmatically

## Setup Steps

### 1. Install Stripe SDK

```bash
npm install stripe
```

### 2. Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** > **API Keys**
3. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

### 3. Add Environment Variables

Add to your `.env` file:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_BASE_URL=https://yourdomain.com  # or http://localhost:3000 for development
```

### 4. Activate Stripe Integration

Uncomment the Stripe code in these files:

#### `/app/api/payment-links/create-checkout-session/route.ts`
- Uncomment lines 63-129 (the Stripe checkout session creation)
- Remove or comment out the temporary response (lines 131-139)

### 5. Set Up Webhook Handler (Important!)

Stripe will send events when payments are completed. You need to handle these webhooks.

#### Create Webhook Route

Create `/app/api/webhooks/stripe/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;

      // Extract metadata
      const {
        paymentLinkId,
        travelDate,
        firstName,
        lastName,
        phone,
        notes,
        travelers,
      } = session.metadata;

      // Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          customer_name: `${firstName} ${lastName}`,
          customer_email: session.customer_email,
          customer_phone: phone,
          travel_date: travelDate,
          booking_status: "confirmed",
          payment_status: "paid",
          payment_method: "card",
          total_cost: session.amount_total / 100, // Convert from cents
          notes: notes || null,
        })
        .select()
        .single();

      if (!bookingError && booking) {
        // Get payment link details
        const { data: paymentLink } = await supabase
          .from("payment_links")
          .select("*")
          .eq("id", paymentLinkId)
          .single();

        if (paymentLink) {
          // Create booking item
          await supabase.from("booking_items").insert({
            booking_id: booking.id,
            experience_title: paymentLink.title,
            price: paymentLink.price,
            quantity: parseInt(travelers),
          });

          // Increment payment link usage (only for one-time payments)
          if (paymentLink.billing_type === "one_time") {
            await supabase
              .from("payment_links")
              .update({
                current_uses: paymentLink.current_uses + 1,
              })
              .eq("id", paymentLinkId);
          }
        }
      }

      // TODO: Send confirmation email

      console.log("Payment successful for:", session.customer_email);
      break;

    case "invoice.payment_succeeded":
      // Handle recurring subscription payment
      const invoice = event.data.object;
      console.log("Recurring payment succeeded for:", invoice.customer_email);
      // TODO: Create booking record for recurring payment
      break;

    case "customer.subscription.deleted":
      // Handle subscription cancellation
      const subscription = event.data.object;
      console.log("Subscription cancelled:", subscription.id);
      // TODO: Update booking status
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
```

#### Configure Webhook in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/) > **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret`

### 6. Test the Integration

#### Test Mode (Development)

1. Use test API keys (they start with `sk_test_`)
2. Use Stripe's test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVV

3. Test webhook locally using [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

#### Live Mode (Production)

1. Replace test keys with live keys (start with `sk_live_`)
2. Configure live webhook endpoint in Stripe Dashboard
3. Test with real cards (in small amounts first!)

## How It Works

### One-time Payments

1. User visits: `yourdomain.com/pay/custom-link-code`
2. User fills out booking form
3. Clicks "Continue to Payment"
4. Redirected to Stripe Checkout page
5. Completes payment with card details
6. Stripe redirects to success page
7. Webhook creates booking in database
8. Confirmation email sent automatically

### Recurring Subscriptions

1. Same as one-time, but user sees subscription details
2. Stripe automatically charges customer every month/year
3. Each payment triggers `invoice.payment_succeeded` webhook
4. You can create a new booking record for each payment
5. Customer can manage subscription in Stripe Customer Portal

### Setting Up Customer Portal (for subscriptions)

Allow customers to manage their subscriptions:

```typescript
// Add this to your API routes
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const session = await stripe.billingPortal.sessions.create({
  customer: customerId, // From checkout session
  return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/account`,
});

// Redirect user to session.url
```

## Pricing Structure

Stripe Fees:
- **Standard pricing**: 2.9% + $0.30 per successful card charge
- **Recurring billing**: Same fees apply to each payment
- **International cards**: Additional 1.5%
- **Currency conversion**: Additional 1%

## Benefits of This Approach

### vs. Manual Stripe Dashboard Setup:
- ✅ No need to manually create products/prices for each experience
- ✅ Faster - create payment links in seconds
- ✅ Dynamic pricing per customer
- ✅ Custom expiration and usage limits
- ✅ Full control over link lifecycle

### vs. Stripe Payment Links (Stripe's native feature):
- ✅ Uses your custom domain
- ✅ Collect custom form data (travel dates, special requests)
- ✅ Your own branding and design
- ✅ Integrated with your booking system
- ✅ More flexibility and customization

## Troubleshooting

### Webhook not receiving events
- Check webhook URL is publicly accessible
- Verify webhook secret is correct
- Check Stripe Dashboard > Developers > Webhooks for errors
- Use Stripe CLI for local testing

### Payment succeeds but booking not created
- Check webhook handler logs
- Verify database permissions
- Check metadata is being passed correctly

### Recurring payments not working
- Ensure `mode: 'subscription'` is set
- Check `recurring_interval` is properly configured
- Verify webhook handles `invoice.payment_succeeded`

## Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)

## Security Best Practices

1. **Never expose your secret key** - Keep it in `.env` only
2. **Always verify webhook signatures** - Prevents fake webhook calls
3. **Use HTTPS in production** - Stripe requires it
4. **Validate amounts** - Check amounts match your pricing
5. **Handle idempotency** - Stripe may send webhooks multiple times

## Next Steps

After integration:
1. ✅ Test thoroughly with test cards
2. ✅ Set up email notifications (Resend, SendGrid, etc.)
3. ✅ Add receipt generation (PDF invoices)
4. ✅ Monitor Stripe Dashboard for failed payments
5. ✅ Set up automatic refund handling
6. ✅ Consider adding Stripe Tax for automatic tax calculation
