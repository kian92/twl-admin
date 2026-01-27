-- Add 'vehicle' to tier_type constraint in package_pricing_tiers table
-- This allows packages to have per-vehicle pricing alongside per-person pricing

-- Drop the existing constraint
ALTER TABLE package_pricing_tiers
DROP CONSTRAINT IF EXISTS package_pricing_tiers_tier_type_check;

-- Add new constraint with 'vehicle' included
ALTER TABLE package_pricing_tiers
ADD CONSTRAINT package_pricing_tiers_tier_type_check
CHECK (tier_type IN ('adult', 'child', 'infant', 'senior', 'student', 'vehicle'));

-- Update comment to reflect new tier type
COMMENT ON COLUMN package_pricing_tiers.tier_type IS 'Type of pricing tier: adult, child, infant, senior, student, or vehicle (for per-vehicle pricing)';
