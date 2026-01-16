-- Add updated_by field to experiences table to track who last updated each experience
-- This provides audit trail for experience modifications

ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add index for better query performance when filtering by updater
CREATE INDEX IF NOT EXISTS idx_experiences_updated_by ON public.experiences(updated_by);

COMMENT ON COLUMN public.experiences.updated_by IS 'User ID of the admin/supplier who last updated this experience';

-- Note: Existing experiences will have NULL updated_by
-- The field will be populated when experiences are updated
