# Database Migration Instructions

## You're seeing "Unable to load booking details" because the new database columns haven't been added yet.

### Option 1: Apply via Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to the **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Copy and paste the entire contents of `supabase/migrations/20251214_add_booking_package_details.sql`
6. Click **Run** or press `Cmd+Enter` / `Ctrl+Enter`
7. You should see "Success. No rows returned" message

### Option 2: Using Supabase CLI

If you have Supabase CLI set up locally:

```bash
# Link to your project (if not already linked)
npx supabase link --project-ref your-project-ref

# Push the migration
npx supabase db push
```

### Option 3: Quick Manual Fix (If you just want to test)

If you want to test the new booking details page right away, you can manually run this SQL in your Supabase dashboard:

```sql
-- Add package-related fields to booking_items table
ALTER TABLE public.booking_items
ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.experience_packages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS package_name TEXT,
ADD COLUMN IF NOT EXISTS tier_type TEXT,
ADD COLUMN IF NOT EXISTS tier_label TEXT,
ADD COLUMN IF NOT EXISTS pax_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit_price NUMERIC,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC,
ADD COLUMN IF NOT EXISTS addons JSONB;

-- Add payment-related fields to bookings table
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

### After Running the Migration

1. Restart your Next.js dev server (if running)
2. Clear your browser cache or do a hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
3. Navigate to `/admin/bookings` and click "View Details" on any booking
4. The page should now load successfully!

### Note About Existing Data

- Existing bookings will continue to work perfectly
- The new fields are all optional (nullable)
- Old bookings won't show package details until you add that data
- The booking details page gracefully handles missing package information

### Troubleshooting

If you still see errors after running the migration:

1. **Check browser console** (F12 → Console tab) for JavaScript errors
2. **Check server logs** in your terminal where Next.js is running
3. **Verify migration was applied**: Run this in Supabase SQL Editor:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'bookings'
   AND column_name IN ('payment_reference', 'payment_date', 'special_requests', 'number_of_adults', 'number_of_children', 'number_of_infants');
   ```
   You should see all 6 columns listed.

4. **Check API response**: Open browser dev tools → Network tab → Click "View Details" on a booking → Check the response from `/api/bookings/[id]/details`
