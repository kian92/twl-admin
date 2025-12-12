-- Add company_name field to admin_profiles for suppliers
-- Suppliers need to specify their company name for identification

ALTER TABLE public.admin_profiles
ADD COLUMN IF NOT EXISTS company_name TEXT;

COMMENT ON COLUMN public.admin_profiles.company_name IS 'Company name for supplier accounts (e.g., "Bali Adventure Tours")';
