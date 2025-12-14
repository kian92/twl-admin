-- Add package-related fields to booking_items table
-- This allows us to store which specific package and pricing tiers were booked

ALTER TABLE public.booking_items
ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.experience_packages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS package_name TEXT,
ADD COLUMN IF NOT EXISTS tier_type TEXT,  -- 'adult', 'child', 'infant', 'senior', 'student'
ADD COLUMN IF NOT EXISTS tier_label TEXT,  -- e.g., "Adult (18-64 years)"
ADD COLUMN IF NOT EXISTS pax_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit_price NUMERIC,  -- Price per person/unit
ADD COLUMN IF NOT EXISTS subtotal NUMERIC,  -- unit_price * pax_count
ADD COLUMN IF NOT EXISTS addons JSONB;  -- Array of selected addons with pricing

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_booking_items_package ON public.booking_items(package_id);
CREATE INDEX IF NOT EXISTS idx_booking_items_booking ON public.booking_items(booking_id);

-- Add payment-related fields to bookings table if they don't exist
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS special_requests TEXT,
ADD COLUMN IF NOT EXISTS number_of_adults INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS number_of_children INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS number_of_infants INTEGER DEFAULT 0;

-- Comment on new columns
COMMENT ON COLUMN public.booking_items.package_id IS 'Reference to the specific package variant booked';
COMMENT ON COLUMN public.booking_items.tier_type IS 'Pricing tier type (adult, child, infant, senior, student)';
COMMENT ON COLUMN public.booking_items.tier_label IS 'Display label for the pricing tier';
COMMENT ON COLUMN public.booking_items.pax_count IS 'Number of passengers for this tier';
COMMENT ON COLUMN public.booking_items.unit_price IS 'Price per person/unit';
COMMENT ON COLUMN public.booking_items.subtotal IS 'Total for this line item (unit_price × pax_count)';
COMMENT ON COLUMN public.booking_items.addons IS 'JSON array of selected addons with pricing details';
