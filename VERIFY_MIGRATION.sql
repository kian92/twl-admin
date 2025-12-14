-- Verify travel_date column exists
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name = 'travel_date';

-- Check all recent bookings
SELECT
  id,
  booking_no,
  customer_name,
  booking_date,
  travel_date,
  number_of_adults,
  number_of_children,
  number_of_infants,
  booking_status,
  payment_status,
  created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 10;

-- Count bookings with and without travel_date
SELECT
  COUNT(*) FILTER (WHERE travel_date IS NOT NULL) as with_travel_date,
  COUNT(*) FILTER (WHERE travel_date IS NULL) as without_travel_date,
  COUNT(*) as total
FROM bookings;
