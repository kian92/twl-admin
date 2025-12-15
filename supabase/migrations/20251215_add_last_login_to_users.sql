-- Add last_login column to users table to track when users last logged in

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.users.last_login IS 'Timestamp of the user''s last successful login';

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login);
