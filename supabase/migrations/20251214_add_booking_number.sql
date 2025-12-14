-- Add booking_no field to bookings table
-- This creates a human-readable booking number like BK-2025-0001

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS booking_no TEXT;

-- Create a sequence for booking numbers
CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;

-- Create function to generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  current_year TEXT;
  booking_num TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

  -- Get next sequence number
  next_num := nextval('booking_number_seq');

  -- Format: BK-YYYY-NNNN (e.g., BK-2025-0001)
  booking_num := 'BK-' || current_year || '-' || LPAD(next_num::TEXT, 4, '0');

  RETURN booking_num;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate booking_no on insert
CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_no IS NULL THEN
    NEW.booking_no := generate_booking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_booking_number ON public.bookings;

CREATE TRIGGER trigger_set_booking_number
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_number();

-- Backfill existing bookings with booking numbers (ordered by created_at)
DO $$
DECLARE
  booking_record RECORD;
BEGIN
  FOR booking_record IN
    SELECT id FROM public.bookings
    WHERE booking_no IS NULL
    ORDER BY created_at ASC
  LOOP
    UPDATE public.bookings
    SET booking_no = generate_booking_number()
    WHERE id = booking_record.id;
  END LOOP;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_booking_no ON public.bookings(booking_no);

-- Make booking_no unique
ALTER TABLE public.bookings
ADD CONSTRAINT unique_booking_no UNIQUE (booking_no);

COMMENT ON COLUMN public.bookings.booking_no IS 'Human-readable booking number in format BK-YYYY-NNNN';
