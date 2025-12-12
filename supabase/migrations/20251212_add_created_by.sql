-- Add created_by field to experiences table to track who created each experience
-- This allows suppliers to only see their own experiences

ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add index for better query performance when filtering by creator
CREATE INDEX IF NOT EXISTS idx_experiences_created_by ON public.experiences(created_by);

COMMENT ON COLUMN public.experiences.created_by IS 'User ID of the admin/supplier who created this experience';

-- Note: Existing experiences will have NULL created_by
-- They can be manually assigned to an admin if needed
