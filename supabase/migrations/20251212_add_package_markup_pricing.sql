-- Add markup pricing fields to package_pricing_tiers table
-- Allows admins to set markup as percentage or fixed amount on base prices

-- Add markup fields to pricing tiers
ALTER TABLE public.package_pricing_tiers
ADD COLUMN IF NOT EXISTS markup_type TEXT CHECK (markup_type IN ('percentage', 'fixed', 'none')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS markup_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS selling_price NUMERIC;

-- Add comments for documentation
COMMENT ON COLUMN public.package_pricing_tiers.markup_type IS 'Type of markup: percentage (%), fixed ($), or none';
COMMENT ON COLUMN public.package_pricing_tiers.markup_value IS 'Markup value: percentage (e.g., 20 for 20%) or fixed amount (e.g., 50 for $50)';
COMMENT ON COLUMN public.package_pricing_tiers.selling_price IS 'Final selling price = base_price + markup. Can be manually overridden.';

-- Rename base_price column comment for clarity
COMMENT ON COLUMN public.package_pricing_tiers.base_price IS 'Base cost price from supplier/operator before markup';

-- Create index for querying by markup type
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_markup_type ON public.package_pricing_tiers(markup_type);

-- Add trigger to auto-calculate selling_price when base_price or markup changes
CREATE OR REPLACE FUNCTION calculate_selling_price()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-calculate if selling_price is NULL (not manually overridden)
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

CREATE TRIGGER trigger_calculate_selling_price
  BEFORE INSERT OR UPDATE OF base_price, markup_type, markup_value
  ON public.package_pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION calculate_selling_price();

COMMENT ON FUNCTION calculate_selling_price() IS 'Auto-calculates selling_price based on base_price and markup. Skips if selling_price is manually set.';
