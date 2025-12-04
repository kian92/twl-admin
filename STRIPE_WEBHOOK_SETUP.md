# Stripe Webhook Setup Guide

This guide will help you set up Stripe webhooks to automatically update payment submissions with receipt URLs.

## What the Webhook Does

The Stripe webhook at `/api/webhooks/stripe` handles the following events:

1. **checkout.session.completed** - When a payment is successful:
   - Updates payment submission status to "paid"
   - Stores the Stripe payment intent ID
   - **Stores the receipt URL from Stripe** (PDF link for download)
   - Increments payment link usage count

2. **checkout.session.expired** - When a session expires:
   - Updates payment submission status to "failed"

3. **charge.refunded** - When a charge is refunded:
   - Updates payment submission status to "refunded"

## Setup Instructions

### 1. Get Your Webhook Secret

#### For Development (Using Stripe CLI):

```bash
# Install Stripe CLI if you haven't already
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret that starts with `whsec_...`

#### For Production:

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `charge.refunded`
5. Copy the webhook signing secret

### 2. Add Environment Variable

Add the webhook secret to your `.env.local` file:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Test the Webhook

#### Development Testing:

1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. In another terminal, run Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. Trigger a test payment:
   ```bash
   stripe trigger checkout.session.completed
   ```

#### Production Testing:

1. Use a real payment link
2. Complete a test payment with a test card (4242 4242 4242 4242)
3. Check your database to see if the submission was updated with `receipt_url`

## How Receipt URLs Work

When a payment is successful:

1. Stripe creates a `payment_intent` with a `charge`
2. The webhook retrieves the `receipt_url` from the charge
3. The `receipt_url` is a hosted Stripe PDF receipt (e.g., `https://pay.stripe.com/receipts/...`)
4. This URL is stored in the `payment_submissions.receipt_url` field
5. Users can click "Download Receipt" on the success page to get the PDF

## Verification

To verify the webhook is working:

1. Make a test payment
2. Check the payment submission in your database:
   ```sql
   SELECT id, payment_status, receipt_url
   FROM payment_submissions
   WHERE stripe_session_id = 'cs_test_...';
   ```
3. The `payment_status` should be "paid"
4. The `receipt_url` should be a Stripe URL starting with `https://pay.stripe.com/receipts/`

## Troubleshooting

### Webhook not receiving events:
- Check that `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify the webhook URL is correct in Stripe Dashboard
- Check server logs for signature verification errors

### Receipt URL is null:
- The webhook may not have processed yet (receipts take a few seconds)
- Check webhook logs in Stripe Dashboard for errors
- Verify the payment was successful (not pending)

### Receipt URL link doesn't work:
- Receipt URLs expire after a certain time (check Stripe docs for expiration)
- Ensure you're using the latest URL from the database
- Test cards may have limited receipt access

## Database Migration

Don't forget to run the migration to add the `receipt_url` field:

```bash
# Apply the migration in Supabase Dashboard
# Or use Supabase CLI:
supabase db push
```

The migration file is located at:
`supabase/migrations/create_payment_submissions_table.sql`
