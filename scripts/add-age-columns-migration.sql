-- Migration: Add age range columns to experiences table
-- This adds support for age-based pricing distinctions

-- Add age columns to experiences table
ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS adult_min_age integer NOT NULL DEFAULT 18,
ADD COLUMN IF NOT EXISTS adult_max_age integer,
ADD COLUMN IF NOT EXISTS child_min_age integer NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS child_max_age integer NOT NULL DEFAULT 17;

-- Add helpful comment
COMMENT ON COLUMN public.experiences.adult_min_age IS 'Minimum age for adult pricing (default: 18)';
COMMENT ON COLUMN public.experiences.adult_max_age IS 'Maximum age for adult pricing (NULL = no upper limit)';
COMMENT ON COLUMN public.experiences.child_min_age IS 'Minimum age for child pricing (default: 3)';
COMMENT ON COLUMN public.experiences.child_max_age IS 'Maximum age for child pricing (default: 17)';
