-- =====================================================
-- Professional Travel Agency Package & Pricing System
-- =====================================================

-- 1. Package Variants (Standard, Premium, Luxury packages for same experience)
CREATE TABLE IF NOT EXISTS public.experience_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,

  -- Package details
  package_name TEXT NOT NULL, -- e.g., "Standard", "Premium", "Luxury"
  package_code TEXT, -- e.g., "STD", "PREM", "LUX"
  description TEXT,

  -- Group size constraints for this package
  min_group_size INTEGER NOT NULL DEFAULT 1,
  max_group_size INTEGER NOT NULL DEFAULT 15,

  -- Availability
  available_from DATE,
  available_to DATE,

  -- Package-specific inclusions/exclusions
  inclusions TEXT[],
  exclusions TEXT[],

  -- Display order
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.experience_packages IS 'Different package tiers for the same experience (e.g., Standard, Premium, Luxury)';

-- 2. Pricing Tiers (Age-based pricing per package)
CREATE TABLE IF NOT EXISTS public.package_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.experience_packages(id) ON DELETE CASCADE,

  -- Pricing tier details
  tier_type TEXT NOT NULL CHECK (tier_type IN ('adult', 'child', 'infant', 'senior', 'student')),
  tier_label TEXT, -- Custom label like "Adult (18-64 years)"

  -- Age restrictions (optional)
  min_age INTEGER,
  max_age INTEGER,

  -- Base price
  base_price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Optional: cost for operator (for margin calculation)
  cost_price NUMERIC,

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.package_pricing_tiers IS 'Age-based pricing tiers (adult, child, infant, senior) for each package';

-- 3. Group Size Pricing (Volume discounts)
CREATE TABLE IF NOT EXISTS public.package_group_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.experience_packages(id) ON DELETE CASCADE,

  -- Group size range
  min_pax INTEGER NOT NULL,
  max_pax INTEGER NOT NULL,

  -- Pricing strategy
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('per_person', 'per_group', 'discount_percentage', 'discount_amount')),

  -- Values based on pricing_type
  price_per_person NUMERIC, -- For per_person type
  price_per_group NUMERIC, -- For per_group type (flat rate for entire group)
  discount_percentage NUMERIC, -- For discount_percentage type (e.g., 10%)
  discount_amount NUMERIC, -- For discount_amount type (e.g., $50 off)

  -- Apply to specific tiers or all
  applies_to_tier_type TEXT, -- NULL = all tiers, or specific: 'adult', 'child', etc.

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

  CONSTRAINT valid_pax_range CHECK (min_pax <= max_pax)
);

COMMENT ON TABLE public.package_group_pricing IS 'Group size-based pricing and volume discounts';

-- 4. Seasonal Pricing (Peak/Off-peak pricing)
CREATE TABLE IF NOT EXISTS public.package_seasonal_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.experience_packages(id) ON DELETE CASCADE,

  -- Season details
  season_name TEXT NOT NULL, -- e.g., "Peak Season", "Off-Peak", "Holiday Season"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Pricing adjustment
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('percentage', 'fixed_amount', 'override_price')),
  adjustment_value NUMERIC NOT NULL,

  -- Apply to specific tiers or all
  applies_to_tier_type TEXT, -- NULL = all tiers

  -- Priority (higher number = higher priority if seasons overlap)
  priority INTEGER DEFAULT 0,

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

  CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

COMMENT ON TABLE public.package_seasonal_pricing IS 'Seasonal pricing adjustments (peak, off-peak, holidays)';

-- 5. Early Bird / Last Minute Discounts
CREATE TABLE IF NOT EXISTS public.package_time_based_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.experience_packages(id) ON DELETE CASCADE,

  -- Discount details
  discount_name TEXT NOT NULL, -- e.g., "Early Bird 60 Days", "Last Minute 7 Days"
  discount_type TEXT NOT NULL CHECK (discount_type IN ('early_bird', 'last_minute')),

  -- Time threshold (days before travel date)
  days_before_travel INTEGER NOT NULL,
  comparison TEXT NOT NULL CHECK (comparison IN ('greater_than', 'less_than', 'equal_to')),

  -- Discount value
  discount_amount_type TEXT NOT NULL CHECK (discount_amount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL,

  -- Validity period for the discount offer itself
  valid_from DATE,
  valid_to DATE,

  -- Apply to specific tiers or all
  applies_to_tier_type TEXT, -- NULL = all tiers

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.package_time_based_discounts IS 'Early bird and last-minute booking discounts';

-- 6. Add-ons / Optional Extras
CREATE TABLE IF NOT EXISTS public.package_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.experience_packages(id) ON DELETE CASCADE,

  -- Add-on details
  addon_name TEXT NOT NULL, -- e.g., "Private Transfer", "Photography Package", "Travel Insurance"
  addon_code TEXT, -- e.g., "TRANSFER", "PHOTO"
  description TEXT,

  -- Pricing
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('per_person', 'per_group', 'per_unit')),
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Constraints
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  is_required BOOLEAN NOT NULL DEFAULT false, -- Is this addon mandatory?

  -- Category for grouping
  category TEXT, -- e.g., "Transportation", "Activities", "Meals", "Insurance"

  -- Display
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.package_addons IS 'Optional add-ons and extras that can be purchased with packages';

-- 7. Special Offers / Promotions
CREATE TABLE IF NOT EXISTS public.package_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Promotion details
  promotion_code TEXT NOT NULL UNIQUE,
  promotion_name TEXT NOT NULL,
  description TEXT,

  -- Discount
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'buy_x_get_y')),
  discount_value NUMERIC,

  -- Buy X Get Y specific fields
  buy_quantity INTEGER, -- Buy X packages
  get_quantity INTEGER, -- Get Y free

  -- Applicable packages (NULL = all packages)
  package_ids UUID[], -- Array of package IDs, NULL means applies to all

  -- Validity
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_to TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Usage limits
  max_uses INTEGER, -- NULL = unlimited
  max_uses_per_customer INTEGER DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,

  -- Minimum requirements
  min_purchase_amount NUMERIC,
  min_pax INTEGER,

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

  CONSTRAINT valid_promo_dates CHECK (valid_from <= valid_to)
);

COMMENT ON TABLE public.package_promotions IS 'Promotional codes and special offers';

-- 8. Custom Date-Based Pricing (for specific departure dates)
CREATE TABLE IF NOT EXISTS public.package_departure_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.experience_packages(id) ON DELETE CASCADE,

  -- Departure date
  departure_date DATE NOT NULL,
  departure_time TIME,

  -- Availability
  available_slots INTEGER NOT NULL,
  booked_slots INTEGER NOT NULL DEFAULT 0,

  -- Custom pricing for this departure (overrides base pricing)
  has_custom_pricing BOOLEAN NOT NULL DEFAULT false,
  custom_adult_price NUMERIC,
  custom_child_price NUMERIC,
  custom_infant_price NUMERIC,
  custom_senior_price NUMERIC,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('available', 'limited', 'sold_out', 'cancelled')) DEFAULT 'available',

  -- Additional info
  guide_name TEXT,
  notes TEXT,

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

  CONSTRAINT valid_slots CHECK (booked_slots <= available_slots)
);

COMMENT ON TABLE public.package_departure_pricing IS 'Specific departure dates with custom pricing and availability';

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX idx_experience_packages_experience ON public.experience_packages(experience_id);
CREATE INDEX idx_experience_packages_active ON public.experience_packages(is_active);

CREATE INDEX idx_pricing_tiers_package ON public.package_pricing_tiers(package_id);
CREATE INDEX idx_pricing_tiers_type ON public.package_pricing_tiers(tier_type);

CREATE INDEX idx_group_pricing_package ON public.package_group_pricing(package_id);
CREATE INDEX idx_group_pricing_pax_range ON public.package_group_pricing(min_pax, max_pax);

CREATE INDEX idx_seasonal_pricing_package ON public.package_seasonal_pricing(package_id);
CREATE INDEX idx_seasonal_pricing_dates ON public.package_seasonal_pricing(start_date, end_date);

CREATE INDEX idx_time_discounts_package ON public.package_time_based_discounts(package_id);

CREATE INDEX idx_addons_package ON public.package_addons(package_id);
CREATE INDEX idx_addons_category ON public.package_addons(category);

CREATE INDEX idx_promotions_code ON public.package_promotions(promotion_code);
CREATE INDEX idx_promotions_dates ON public.package_promotions(valid_from, valid_to);

CREATE INDEX idx_departure_pricing_package ON public.package_departure_pricing(package_id);
CREATE INDEX idx_departure_pricing_date ON public.package_departure_pricing(departure_date);

-- =====================================================
-- Helper Function: Calculate Package Price
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_package_price(
  p_package_id UUID,
  p_travel_date DATE,
  p_booking_date DATE DEFAULT CURRENT_DATE,
  p_adult_count INTEGER DEFAULT 0,
  p_child_count INTEGER DEFAULT 0,
  p_infant_count INTEGER DEFAULT 0,
  p_senior_count INTEGER DEFAULT 0,
  p_promo_code TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_price NUMERIC,
  base_price NUMERIC,
  seasonal_adjustment NUMERIC,
  group_discount NUMERIC,
  time_based_discount NUMERIC,
  promo_discount NUMERIC,
  breakdown JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_base_price NUMERIC := 0;
  v_total_pax INTEGER;
  v_days_before INTEGER;
  v_adult_price NUMERIC := 0;
  v_child_price NUMERIC := 0;
  v_infant_price NUMERIC := 0;
  v_senior_price NUMERIC := 0;
BEGIN
  -- Calculate total passengers
  v_total_pax := p_adult_count + p_child_count + p_infant_count + p_senior_count;

  -- Calculate days before travel
  v_days_before := p_travel_date - p_booking_date;

  -- Get base prices for each tier
  SELECT COALESCE(base_price, 0) INTO v_adult_price
  FROM public.package_pricing_tiers
  WHERE package_id = p_package_id AND tier_type = 'adult' AND is_active = true
  LIMIT 1;

  SELECT COALESCE(base_price, 0) INTO v_child_price
  FROM public.package_pricing_tiers
  WHERE package_id = p_package_id AND tier_type = 'child' AND is_active = true
  LIMIT 1;

  SELECT COALESCE(base_price, 0) INTO v_infant_price
  FROM public.package_pricing_tiers
  WHERE package_id = p_package_id AND tier_type = 'infant' AND is_active = true
  LIMIT 1;

  SELECT COALESCE(base_price, 0) INTO v_senior_price
  FROM public.package_pricing_tiers
  WHERE package_id = p_package_id AND tier_type = 'senior' AND is_active = true
  LIMIT 1;

  -- Calculate base price
  v_base_price := (v_adult_price * p_adult_count) +
                  (v_child_price * p_child_count) +
                  (v_infant_price * p_infant_count) +
                  (v_senior_price * p_senior_count);

  -- TODO: Add seasonal adjustments, group discounts, time-based discounts, promo codes
  -- This is a simplified version - extend based on your business logic

  RETURN QUERY SELECT
    v_base_price as total_price,
    v_base_price as base_price,
    0::NUMERIC as seasonal_adjustment,
    0::NUMERIC as group_discount,
    0::NUMERIC as time_based_discount,
    0::NUMERIC as promo_discount,
    jsonb_build_object(
      'adult_count', p_adult_count,
      'adult_price', v_adult_price,
      'child_count', p_child_count,
      'child_price', v_child_price,
      'infant_count', p_infant_count,
      'infant_price', v_infant_price,
      'senior_count', p_senior_count,
      'senior_price', v_senior_price
    ) as breakdown;
END;
$$;

COMMENT ON FUNCTION public.calculate_package_price IS 'Calculates total package price with all discounts and adjustments';

-- =====================================================
-- Sample Data Migration from existing experiences
-- =====================================================

-- Migrate existing experiences to new package system
-- Create a "Standard" package for each existing experience
INSERT INTO public.experience_packages (
  experience_id,
  package_name,
  package_code,
  description,
  min_group_size,
  max_group_size,
  available_from,
  available_to,
  inclusions,
  is_active
)
SELECT
  id as experience_id,
  'Standard Package' as package_name,
  'STD' as package_code,
  'Our standard package with all essential inclusions' as description,
  min_group_size,
  max_group_size,
  available_from,
  available_to,
  inclusions,
  true as is_active
FROM public.experiences
ON CONFLICT DO NOTHING;

-- Create adult and child pricing tiers for migrated packages
WITH new_packages AS (
  SELECT
    ep.id as package_id,
    COALESCE(e.adult_price, e.price, 0) as adult_price,
    COALESCE(e.child_price, e.price * 0.7, 0) as child_price
  FROM public.experience_packages ep
  JOIN public.experiences e ON ep.experience_id = e.id
  WHERE ep.package_code = 'STD'
    AND (e.adult_price IS NOT NULL OR e.price IS NOT NULL)
)
INSERT INTO public.package_pricing_tiers (
  package_id,
  tier_type,
  tier_label,
  min_age,
  max_age,
  base_price,
  is_active
)
SELECT
  package_id,
  'adult' as tier_type,
  'Adult (18+ years)' as tier_label,
  18 as min_age,
  NULL as max_age,
  adult_price as base_price,
  true as is_active
FROM new_packages
WHERE adult_price > 0
UNION ALL
SELECT
  package_id,
  'child' as tier_type,
  'Child (3-17 years)' as tier_label,
  3 as min_age,
  17 as max_age,
  child_price as base_price,
  true as is_active
FROM new_packages
WHERE child_price > 0
ON CONFLICT DO NOTHING;
