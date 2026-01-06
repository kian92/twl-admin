-- Add supplier currency fields to package_addons table
-- This allows suppliers to enter their add-on costs in their own currency

ALTER TABLE package_addons
ADD COLUMN IF NOT EXISTS supplier_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS supplier_cost NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS addon_exchange_rate NUMERIC(10,6) DEFAULT 1.0;

-- Add comments for clarity
COMMENT ON COLUMN package_addons.supplier_currency IS 'ISO currency code for supplier''s native currency (e.g., EUR, JPY, CNY, USD)';
COMMENT ON COLUMN package_addons.supplier_cost IS 'Cost in supplier''s original currency';
COMMENT ON COLUMN package_addons.addon_exchange_rate IS 'Exchange rate used to convert supplier currency to USD. 1 supplier_currency = X USD';

-- Update existing rows to have supplier costs matching prices
-- (assuming existing data is in USD)
UPDATE package_addons
SET
  supplier_cost = price,
  supplier_currency = 'USD',
  addon_exchange_rate = 1.0
WHERE supplier_cost IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_package_addons_currency ON package_addons(supplier_currency);

COMMENT ON TABLE package_addons IS 'Add-ons and optional extras for packages with multi-currency support';
