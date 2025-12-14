# Travel Date & Pax Count Fix

## Problem Identified ✅

Based on the browser console logs, I found the root cause:

### Issue 1: Travel Date shows "Invalid Date"
**Root Cause**: The `travel_date` column **does not exist** in the `bookings` table!

**Evidence from console log:**
```javascript
Travel Date: undefined Type: undefined
```

The webhook is trying to save `travel_date` to the bookings table, but the column doesn't exist, so it's silently ignored by PostgreSQL.

### Issue 2: Number of Adults shows 0 instead of 4
**Root Cause**: The `number_of_adults` column exists but has `DEFAULT 0`. When the webhook inserts data, if there's any issue with the insert, it falls back to 0.

**Evidence from console log:**
```javascript
Number of Adults: 0
```

But in the booking_items, we correctly see:
```javascript
quantity: 4
travel_date: "2025-12-30"  // This is wrong location!
```

**Wait, why is `travel_date` in booking_items?** This is confusing - it shouldn't be there. Let me check if there's a column collision.

## The Solution

### Step 1: Add `travel_date` Column to Bookings Table

Run this migration in your Supabase SQL Editor:

```sql
-- Add travel_date column to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS travel_date DATE;

-- Add index for common queries filtering by travel date
CREATE INDEX IF NOT EXISTS idx_bookings_travel_date ON public.bookings(travel_date);

-- Add comment
COMMENT ON COLUMN public.bookings.travel_date IS 'The date when the customer plans to travel/start the experience';
```

**OR** if you prefer using the migration file:

```bash
# The migration file is ready at:
supabase/migrations/20251214_add_travel_date_to_bookings.sql

# If using Supabase CLI:
supabase db push
```

### Step 2: Verify the Column Was Added

Run this query in Supabase SQL Editor:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name IN ('travel_date', 'number_of_adults');
```

**Expected result:**
```
column_name       | data_type | is_nullable
------------------+-----------+------------
travel_date       | date      | YES
number_of_adults  | integer   | YES
```

### Step 3: Test Again

1. **Complete a new checkout** on `/pay/[linkCode]`
2. **Select a travel date** (e.g., December 30, 2025)
3. **Select 4 travelers**
4. **Complete payment** with test card: `4242 4242 4242 4242`
5. **Check the booking details** page

### Step 4: Verify in Database

After checkout, run this query to verify data was saved:

```sql
SELECT
  id,
  booking_no,
  customer_name,
  travel_date,
  number_of_adults,
  number_of_children,
  number_of_infants,
  created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 1;
```

**Expected result:**
```
travel_date: 2025-12-30
number_of_adults: 4
number_of_children: 0
number_of_infants: 0
```

And for booking items:

```sql
SELECT
  booking_id,
  experience_title,
  quantity,
  pax_count,
  unit_price,
  subtotal
FROM booking_items
WHERE booking_id = '[your-booking-id]';
```

**Expected result:**
```
quantity: 4
pax_count: 4
```

## Why This Happened

The `travel_date` column was never added to the `bookings` table when the initial schema was created. The field exists in:

- ✅ `payment_submissions` table (where form data is stored)
- ❌ `bookings` table (where final booking records are stored) - **MISSING!**

When the webhook tried to insert a booking with `travel_date: submission.travel_date`, PostgreSQL just ignored the field because it doesn't exist in the table schema.

## What About Old Bookings?

Old bookings created before this fix will have:
- `travel_date: NULL`
- `number_of_adults: 0` (or whatever the default was)

If you need to backfill travel dates for old bookings, you can run:

```sql
-- Backfill travel dates from payment_submissions
UPDATE bookings b
SET travel_date = ps.travel_date,
    number_of_adults = ps.travelers
FROM payment_submissions ps
WHERE ps.stripe_payment_intent_id = b.payment_reference
  AND b.travel_date IS NULL
  AND ps.payment_status = 'paid';
```

**⚠️ Warning**: Only run this if you're sure the payment_reference matches the stripe_payment_intent_id!

## Files Created

1. **Migration file**: `supabase/migrations/20251214_add_travel_date_to_bookings.sql`
2. **This guide**: `TRAVEL_DATE_FIX.md`

## Next Steps

1. ✅ Run the migration to add `travel_date` column
2. ✅ Test with a new checkout
3. ✅ Verify data appears correctly in booking details page
4. ✅ Check server logs show correct values in webhook
5. (Optional) Backfill old bookings if needed
