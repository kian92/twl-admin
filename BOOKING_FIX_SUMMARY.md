# Booking Creation Fix - Travel Date & Pax Count Issues

## Issues Found ✅ FIXED

### Problem 1: Travel Date Missing
**Symptom:** Travel date not showing in booking details page
**Root Cause:** Bookings were never being created from Stripe payments
**Status:** ✅ FIXED

### Problem 2: Pax Count Always Shows 1
**Symptom:** Passenger count shows 1 even when booking for 2+ people
**Root Cause:** The `pax_count` field was never populated when creating bookings
**Status:** ✅ FIXED

---

## Root Cause Analysis

The booking creation flow was **incomplete**:

1. ✅ Customer submits form at `/pay/[linkCode]`
2. ✅ Form data saved to `payment_submissions` table
3. ✅ Stripe checkout session created
4. ✅ Customer completes payment on Stripe
5. ✅ Stripe webhook receives `checkout.session.completed` event
6. ✅ Webhook updates `payment_submissions` status to "paid"
7. ❌ **Webhook DID NOT create `bookings` record**
8. ❌ **Webhook DID NOT create `booking_items` record**

**Result:** Payment submissions were tracked, but no actual bookings were created in the system!

---

## What Was Fixed

### Updated File: `app/api/webhooks/stripe/route.ts`

**Added booking creation logic** in the `checkout.session.completed` webhook handler (lines 61-133):

1. **Fetch payment submission data** - Get all customer & booking details
2. **Fetch payment link data** - Get experience details
3. **Create booking record** with:
   - Customer name, email, phone
   - **Travel date** from submission ✅
   - Booking date (today)
   - Booking status: "confirmed"
   - Payment status: "paid"
   - Payment method: "stripe"
   - Payment reference: Stripe payment intent ID
   - Payment date: Now
   - Total cost from submission
   - Special requests from notes
   - **number_of_adults**: travelers count ✅
   - number_of_children: 0
   - number_of_infants: 0

4. **Create booking_items record** with:
   - booking_id: newly created booking
   - experience_id: from payment link
   - experience_title: from payment link
   - price: unit price from payment link
   - **quantity**: travelers count ✅
   - **pax_count**: travelers count ✅ (NEW FIELD)
   - unit_price: from payment link
   - subtotal: price × travelers
   - tier_type: "adult" (default)
   - tier_label: "Adult"

---

## How It Works Now

### For NEW Bookings (After Fix)

When a customer completes payment:

1. Stripe webhook triggers
2. **Booking is automatically created** with:
   - ✅ Correct travel date
   - ✅ Correct passenger count
   - ✅ All customer details
   - ✅ Payment information
3. Shows up in `/admin/bookings` immediately
4. Full details visible at `/admin/bookings/[id]`

### For OLD Bookings (Before Fix)

**Old bookings in the system:**
- These were likely created manually or through a different flow
- May have missing travel dates or incorrect pax counts
- Will need to be updated manually if corrections are needed

**Old payment submissions:**
- Payment submissions exist but have no associated bookings
- You can identify these by checking `payment_submissions` where `payment_status = 'paid'` but no matching booking exists
- Optional: You could create a migration script to backfill bookings from old submissions

---

## Testing the Fix

### Test with a New Booking

1. **Create a payment link** (if you don't have one)
   - Go to `/admin/payment-links`
   - Create a test link with a low price

2. **Make a test booking**
   - Go to `/pay/[your-link-code]`
   - Fill out the form:
     - Name, email, phone
     - **Travel date**: Pick a future date
     - **Travelers**: Select 2 or more
     - Notes: "Test booking"
   - Complete Stripe payment (use test card: 4242 4242 4242 4242)

3. **Verify in admin**
   - Go to `/admin/bookings`
   - You should see the new booking
   - Click "View Details"
   - **Check:**
     - ✅ Travel date should show your selected date
     - ✅ Total Passengers should show "2 pax" (or your selected count)
     - ✅ Pricing table should show "Pax: 2" (not 1)
     - ✅ Customer details should be complete
     - ✅ Payment reference should be present

---

## Important Notes

### Passenger Type Assumptions

Currently, the system assumes **all travelers are adults** because the payment link checkout form doesn't distinguish between adults/children/infants.

**Current behavior:**
- `number_of_adults` = total travelers
- `number_of_children` = 0
- `number_of_infants` = 0
- `tier_type` = "adult"

**If you need child/infant support:**
You'll need to update the checkout form to ask:
- How many adults?
- How many children?
- How many infants?

Then update the webhook to create separate booking_items for each tier.

### Payment Link Requirements

The payment link **must have** `experience_id` set for the booking to include experience details. If `experience_id` is null, the booking will still be created but without experience association.

### Webhook Logging

The webhook now logs:
- "Booking created successfully: [booking-id]"
- "Booking item created successfully"
- Any errors during booking creation

Check your server logs (or Stripe webhook logs) if bookings aren't being created.

---

## Migration Impact

This fix works with the database migration you already ran:
- `20251214_add_booking_package_details.sql`

The new fields are now properly populated:
- ✅ `bookings.travel_date`
- ✅ `bookings.payment_reference`
- ✅ `bookings.payment_date`
- ✅ `bookings.special_requests`
- ✅ `bookings.number_of_adults`
- ✅ `booking_items.pax_count`
- ✅ `booking_items.unit_price`
- ✅ `booking_items.subtotal`
- ✅ `booking_items.tier_type`
- ✅ `booking_items.tier_label`

---

## Next Steps

1. ✅ **Deploy the fix** - The webhook handler is now updated
2. ✅ **Test with a real booking** - Complete a test purchase
3. ✅ **Verify in admin dashboard** - Check travel date and pax count
4. ⚠️ **Handle old submissions** (optional) - Decide if you want to backfill bookings from old payment submissions
5. 🔮 **Consider child/infant tiers** (future) - If needed, update checkout form and webhook

---

## Questions?

**Q: Will this affect existing bookings?**
A: No, this only affects NEW bookings created after deploying this fix.

**Q: What about old payment submissions?**
A: They remain in the database but have no associated bookings. You can backfill them if needed.

**Q: Do I need to update my payment links?**
A: No, existing payment links will work with this fix automatically.

**Q: How do I test without real payment?**
A: Use Stripe test mode with test card 4242 4242 4242 4242 (any future expiry, any CVV).
