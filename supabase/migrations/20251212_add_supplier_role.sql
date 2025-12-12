-- Add 'supplier' role to admin_profiles table
-- Suppliers can upload experiences but cannot see markup pricing

-- First, check if the role column exists and update its constraint
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'admin_profiles_role_check'
  ) THEN
    ALTER TABLE public.admin_profiles DROP CONSTRAINT admin_profiles_role_check;
  END IF;

  -- Add new constraint including 'supplier'
  ALTER TABLE public.admin_profiles
  ADD CONSTRAINT admin_profiles_role_check
  CHECK (role IN ('admin', 'manager', 'support', 'sales', 'supplier'));
END $$;

-- Add comment to document supplier role
COMMENT ON COLUMN public.admin_profiles.role IS 'User role: admin (full access), manager (management access), support (customer support), sales (sales team), supplier (experience providers - can create experiences but cannot see markup pricing)';

-- Note: Existing admin_profiles records remain unchanged
-- New supplier users should be created with role='supplier'
