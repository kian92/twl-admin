-- =====================================================
-- Enhanced Pricing Tiers for Custom Tier Selection
-- =====================================================
-- This migration adds support for tier-ID-based selection
-- to properly handle custom pricing tiers with unique labels

-- Add new columns to package_pricing_tiers
ALTER TABLE package_pricing_tiers
  ADD COLUMN IF NOT EXISTS tier_code TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requires_adult_accompaniment BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_per_booking INTEGER,
  ADD COLUMN IF NOT EXISTS booking_notes TEXT;

-- Add comments to explain new columns
COMMENT ON COLUMN package_pricing_tiers.tier_code IS 'Unique code for this tier (e.g., "CHILD_TWIN_SHARE")';
COMMENT ON COLUMN package_pricing_tiers.description IS 'Detailed description for this tier (e.g., "Includes twin bedroom shared with 1 adult")';
COMMENT ON COLUMN package_pricing_tiers.display_order IS 'Order in which tiers should be displayed in UI (lower = first)';
COMMENT ON COLUMN package_pricing_tiers.requires_adult_accompaniment IS 'Whether this tier requires at least one adult in the booking';
COMMENT ON COLUMN package_pricing_tiers.max_per_booking IS 'Maximum number of this tier type allowed per booking';
COMMENT ON COLUMN package_pricing_tiers.booking_notes IS 'Additional notes or requirements for this tier';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_package_active
  ON package_pricing_tiers(package_id, is_active);

CREATE INDEX IF NOT EXISTS idx_pricing_tiers_display_order
  ON package_pricing_tiers(package_id, display_order);

-- Add flag to experience_packages to indicate if custom tiers are used
ALTER TABLE experience_packages
  ADD COLUMN IF NOT EXISTS use_custom_tiers BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN experience_packages.use_custom_tiers IS 'Whether this package uses custom tier selection (true) or generic adult/child counts (false)';

-- Create helpful view for retrieving package tiers with all details
CREATE OR REPLACE VIEW v_package_pricing_details AS
SELECT
  p.id as package_id,
  p.package_name,
  p.package_code,
  p.use_custom_tiers,
  p.min_group_size,
  p.max_group_size,
  pt.id as tier_id,
  pt.tier_type,
  pt.tier_label,
  pt.tier_code,
  pt.description,
  pt.min_age,
  pt.max_age,
  pt.base_price,
  pt.selling_price,
  pt.currency,
  pt.display_order,
  pt.requires_adult_accompaniment,
  pt.max_per_booking,
  pt.booking_notes,
  pt.supplier_cost,
  pt.supplier_currency,
  pt.exchange_rate,
  pt.markup_type,
  pt.markup_value,
  pt.is_active as tier_is_active
FROM experience_packages p
LEFT JOIN package_pricing_tiers pt ON pt.package_id = p.id
WHERE p.is_active = true
ORDER BY p.id, pt.display_order, pt.tier_type;

COMMENT ON VIEW v_package_pricing_details IS 'Complete view of packages with their pricing tiers for easy querying';

-- Update existing custom tier packages to set the flag
-- (Packages that have multiple tiers of the same type are likely using custom tiers)
UPDATE experience_packages
SET use_custom_tiers = true
WHERE id IN (
  SELECT DISTINCT pt.package_id
  FROM package_pricing_tiers pt
  WHERE pt.is_active = true
  GROUP BY pt.package_id, pt.tier_type
  HAVING COUNT(*) > 1
);

-- Generate tier_code for existing tiers that don't have one
UPDATE package_pricing_tiers
SET tier_code = UPPER(tier_type) || '_' || SUBSTRING(id::text, 1, 8)
WHERE tier_code IS NULL OR tier_code = '';

-- Set display_order for existing tiers based on creation date
WITH ranked_tiers AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY package_id ORDER BY created_at, tier_type) as rank
  FROM package_pricing_tiers
  WHERE display_order = 0 OR display_order IS NULL
)
UPDATE package_pricing_tiers pt
SET display_order = rt.rank
FROM ranked_tiers rt
WHERE pt.id = rt.id;

-- Set requires_adult_accompaniment for child/infant tiers by default
UPDATE package_pricing_tiers
SET requires_adult_accompaniment = true
WHERE tier_type IN ('child', 'infant')
  AND requires_adult_accompaniment = false;

-- Create function to validate tier selection
CREATE OR REPLACE FUNCTION validate_tier_selection(
  p_package_id UUID,
  p_selected_tiers JSONB
) RETURNS TABLE(
  is_valid BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_min_group_size INTEGER;
  v_max_group_size INTEGER;
  v_total_pax INTEGER := 0;
  v_adult_count INTEGER := 0;
  v_child_requiring_adult_count INTEGER := 0;
  v_tier RECORD;
BEGIN
  -- Get package constraints
  SELECT min_group_size, max_group_size
  INTO v_min_group_size, v_max_group_size
  FROM experience_packages
  WHERE id = p_package_id;

  -- Calculate totals from selected tiers
  FOR v_tier IN
    SELECT
      t.tier_type,
      t.requires_adult_accompaniment,
      t.max_per_booking,
      t.tier_label,
      (p_selected_tiers->>'tier_id')::UUID as tier_id,
      (p_selected_tiers->>'quantity')::INTEGER as quantity
    FROM jsonb_array_elements(p_selected_tiers) AS selection
    JOIN package_pricing_tiers t ON t.id = (selection->>'tier_id')::UUID
    WHERE t.is_active = true
  LOOP
    v_total_pax := v_total_pax + v_tier.quantity;

    IF v_tier.tier_type = 'adult' THEN
      v_adult_count := v_adult_count + v_tier.quantity;
    END IF;

    IF v_tier.requires_adult_accompaniment THEN
      v_child_requiring_adult_count := v_child_requiring_adult_count + v_tier.quantity;
    END IF;

    -- Check max per booking
    IF v_tier.max_per_booking IS NOT NULL AND v_tier.quantity > v_tier.max_per_booking THEN
      RETURN QUERY SELECT false,
        v_tier.tier_label || ': Maximum ' || v_tier.max_per_booking || ' per booking.';
      RETURN;
    END IF;
  END LOOP;

  -- Validate group size
  IF v_total_pax < v_min_group_size THEN
    RETURN QUERY SELECT false,
      'Minimum group size is ' || v_min_group_size || ' passengers. You have ' || v_total_pax || '.';
    RETURN;
  END IF;

  IF v_max_group_size IS NOT NULL AND v_total_pax > v_max_group_size THEN
    RETURN QUERY SELECT false,
      'Maximum group size is ' || v_max_group_size || ' passengers. You have ' || v_total_pax || '.';
    RETURN;
  END IF;

  -- Validate adult accompaniment
  IF v_child_requiring_adult_count > 0 AND v_adult_count = 0 THEN
    RETURN QUERY SELECT false,
      'At least one adult is required when booking children.';
    RETURN;
  END IF;

  -- All validations passed
  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_tier_selection IS 'Validates tier selection against package rules and constraints';

-- Grant permissions
GRANT SELECT ON v_package_pricing_details TO authenticated;
GRANT EXECUTE ON FUNCTION validate_tier_selection TO authenticated;
