-- Check if travel_date column exists in bookings table
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name IN ('travel_date', 'number_of_adults', 'number_of_children', 'number_of_infants')
ORDER BY ordinal_position;

-- Also check booking_items table columns
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'booking_items'
  AND column_name IN ('pax_count', 'unit_price', 'subtotal', 'quantity', 'travel_date')
ORDER BY ordinal_position;

-- Check the most recent booking (without travel_date since it doesn't exist yet)
SELECT
  id,
  booking_no,
  customer_name,
  booking_date,
  -- travel_date,  -- Column doesn't exist yet!
  number_of_adults,
  number_of_children,
  number_of_infants,
  booking_status,
  payment_status,
  created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 1;
