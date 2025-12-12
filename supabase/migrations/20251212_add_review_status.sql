-- Add 'review' status to experiences table
-- Suppliers submit experiences with status='review', staff must approve before publishing

-- Drop existing check constraint on status
ALTER TABLE public.experiences DROP CONSTRAINT IF EXISTS experiences_status_check;

-- Add new constraint including 'review'
ALTER TABLE public.experiences
ADD CONSTRAINT experiences_status_check
CHECK (status IN ('draft', 'review', 'active'));

-- Add comment to document review status
COMMENT ON COLUMN public.experiences.status IS 'Experience status: draft (work in progress), review (submitted by supplier, awaiting approval), active (published and visible to customers)';

-- Note: Existing experiences remain unchanged
-- Supplier-created experiences will have status='review' by default
