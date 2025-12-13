-- Add supplier currency fields to package_pricing_tiers table
-- This allows suppliers to enter their original costs in their own currency

ALTER TABLE package_pricing_tiers
ADD COLUMN IF NOT EXISTS supplier_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS supplier_cost NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10,6) DEFAULT 1.0;

-- Add comments for clarity
COMMENT ON COLUMN package_pricing_tiers.supplier_currency IS 'ISO currency code for supplier''s native currency (e.g., EUR, JPY, CNY, USD)';
COMMENT ON COLUMN package_pricing_tiers.supplier_cost IS 'Cost in supplier''s original currency';
COMMENT ON COLUMN package_pricing_tiers.exchange_rate IS 'Exchange rate used to convert supplier currency to base currency (USD). 1 supplier_currency = X USD';

-- Update existing rows to have supplier costs matching base prices
-- (assuming existing data is in USD)
UPDATE package_pricing_tiers
SET
  supplier_cost = base_price,
  supplier_currency = 'USD',
  exchange_rate = 1.0
WHERE supplier_cost IS NULL;

-- Update the trigger to also convert supplier_cost to base_price when exchange rate changes
CREATE OR REPLACE FUNCTION calculate_prices_with_currency()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert supplier cost to base price using exchange rate
  IF NEW.supplier_cost IS NOT NULL AND NEW.exchange_rate IS NOT NULL THEN
    NEW.base_price := ROUND(NEW.supplier_cost * NEW.exchange_rate, 2);
  END IF;

  -- Calculate selling price based on markup (existing logic)
  IF NEW.selling_price IS NULL THEN
    IF NEW.markup_type = 'percentage' THEN
      NEW.selling_price := NEW.base_price + (NEW.base_price * NEW.markup_value / 100);
    ELSIF NEW.markup_type = 'fixed' THEN
      NEW.selling_price := NEW.base_price + NEW.markup_value;
    ELSE
      -- markup_type = 'none'
      NEW.selling_price := NEW.base_price;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace the existing trigger with the new one
DROP TRIGGER IF EXISTS trigger_calculate_selling_price ON package_pricing_tiers;
CREATE TRIGGER trigger_calculate_prices
  BEFORE INSERT OR UPDATE OF supplier_cost, exchange_rate, base_price, markup_type, markup_value
  ON package_pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION calculate_prices_with_currency();

COMMENT ON FUNCTION calculate_prices_with_currency() IS 'Auto-converts supplier_cost to base_price using exchange_rate, then calculates selling_price based on markup.';
