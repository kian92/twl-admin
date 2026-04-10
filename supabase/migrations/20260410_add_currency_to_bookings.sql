ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

COMMENT ON COLUMN public.bookings.currency IS 'Currency for the booking total_cost, such as USD, SGD, or MYR.';
