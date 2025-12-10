-- Add 'sales' role to admin_profiles table
ALTER TABLE public.admin_profiles
DROP CONSTRAINT IF EXISTS admin_profiles_role_check;

ALTER TABLE public.admin_profiles
ADD CONSTRAINT admin_profiles_role_check
CHECK (role IN ('admin', 'manager', 'support', 'sales'));
