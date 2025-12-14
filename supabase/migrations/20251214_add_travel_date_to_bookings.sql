-- Add travel_date column to bookings table
-- This field stores when the customer plans to travel (not when they booked)

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS travel_date DATE;

-- Add index for common queries filtering by travel date
CREATE INDEX IF NOT EXISTS idx_bookings_travel_date ON public.bookings(travel_date);

-- Add comment
COMMENT ON COLUMN public.bookings.travel_date IS 'The date when the customer plans to travel/start the experience';
