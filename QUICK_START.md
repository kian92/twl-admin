# Quick Start Guide - New Booking Details Page

## The "Unable to load booking details" error means you need to run the database migration first!

### ⚡ Quick Fix (2 minutes)

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your TWL project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste this SQL**
   ```sql
   -- Add new columns to booking_items
   ALTER TABLE public.booking_items
   ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.experience_packages(id) ON DELETE SET NULL,
   ADD COLUMN IF NOT EXISTS package_name TEXT,
   ADD COLUMN IF NOT EXISTS tier_type TEXT,
   ADD COLUMN IF NOT EXISTS tier_label TEXT,
   ADD COLUMN IF NOT EXISTS pax_count INTEGER DEFAULT 1,
   ADD COLUMN IF NOT EXISTS unit_price NUMERIC,
   ADD COLUMN IF NOT EXISTS subtotal NUMERIC,
   ADD COLUMN IF NOT EXISTS addons JSONB;

   -- Add new columns to bookings
   ALTER TABLE public.bookings
   ADD COLUMN IF NOT EXISTS payment_reference TEXT,
   ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
   ADD COLUMN IF NOT EXISTS special_requests TEXT,
   ADD COLUMN IF NOT EXISTS number_of_adults INTEGER DEFAULT 0,
   ADD COLUMN IF NOT EXISTS number_of_children INTEGER DEFAULT 0,
   ADD COLUMN IF NOT EXISTS number_of_infants INTEGER DEFAULT 0;

   -- Add indexes
   CREATE INDEX IF NOT EXISTS idx_booking_items_package ON public.booking_items(package_id);
   CREATE INDEX IF NOT EXISTS idx_booking_items_booking ON public.booking_items(booking_id);
   ```

4. **Run it**
   - Click the "Run" button or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)
   - You should see "Success" message

5. **Test it**
   - Refresh your browser
   - Go to `/admin/bookings`
   - Click "View Details" on any booking
   - ✅ It should now work!

---

## What's New?

### 📍 Before (Modal Popup)
- Limited information
- Small popup window
- Hard to see all details
- No package information

### ✨ After (Full Page)
- **Complete booking overview** with status indicators
- **Full customer details** including passenger counts
- **Detailed package breakdown:**
  - Package name and type (Standard/Premium/Luxury)
  - Pricing tiers (Adult/Child/Infant/Senior)
  - Passenger count per tier
  - Unit prices and subtotals
- **Experience details:**
  - Meeting point
  - What to bring
  - Cancellation policy
  - Package inclusions/exclusions
- **Payment tracking:**
  - Payment method
  - Payment reference
  - Payment date
  - Payment status
- **Admin controls:**
  - Update booking status
  - Update payment status
  - Add internal notes
  - Print (placeholder)
  - Send email (placeholder)

---

## Navigation

- **List View:** `/admin/bookings` - See all bookings in a table
- **Detail View:** `/admin/bookings/[booking-id]` - See complete booking details
- Click "View Details" button to go from list to detail view
- Click "Back" button to return to list

---

## Troubleshooting

### Still seeing errors after migration?

1. **Check browser console** (F12 → Console tab)
2. **Check server logs** in your terminal
3. **Verify columns exist:**
   ```sql
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'bookings'
   AND column_name IN ('payment_reference', 'special_requests');
   ```
   Should return 2 rows.

### Old bookings showing blank package info?

- That's normal! Old bookings don't have package data yet
- The page will show "No experiences booked" for the package section
- All other booking info will display normally

---

## For Developers

- **Migration file:** `supabase/migrations/20251214_add_booking_package_details.sql`
- **API endpoint:** `/api/bookings/[id]/details`
- **Page component:** `app/admin/bookings/[id]/page.tsx`
- **List component:** `app/admin/bookings/page.tsx`
- **Database types:** `types/database.ts`

Need help? Check the detailed `MIGRATION_INSTRUCTIONS.md` file.
