-- Verification: Check current column types for highlights, inclusions, exclusions

SELECT
    column_name,
    data_type,
    udt_name,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'experiences'
  AND column_name IN ('highlights', 'inclusions', 'exclusions')
ORDER BY column_name;

-- Also check all age-related columns
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'experiences'
  AND column_name IN ('adult_min_age', 'adult_max_age', 'child_min_age', 'child_max_age')
ORDER BY column_name;
