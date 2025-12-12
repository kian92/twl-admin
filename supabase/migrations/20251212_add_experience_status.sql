-- Add status field to experiences table to support draft functionality
ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
CHECK (status IN ('draft', 'active'));

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_experiences_status ON public.experiences(status);

-- Add comment for documentation
COMMENT ON COLUMN public.experiences.status IS 'Experience publication status: draft (not visible to customers) or active (published and visible)';
