ALTER TABLE public.package_pricing_tiers
ADD COLUMN IF NOT EXISTS selling_prices JSONB NOT NULL DEFAULT '{"USD": 0, "SGD": 0, "MYR": 0}'::jsonb;

ALTER TABLE public.package_addons
ADD COLUMN IF NOT EXISTS prices_by_currency JSONB NOT NULL DEFAULT '{"USD": 0, "SGD": 0, "MYR": 0}'::jsonb;

COMMENT ON COLUMN public.package_pricing_tiers.selling_prices IS 'Customer-facing selling prices stored separately for USD, SGD, and MYR.';
COMMENT ON COLUMN public.package_addons.prices_by_currency IS 'Addon prices stored separately for USD, SGD, and MYR.';
