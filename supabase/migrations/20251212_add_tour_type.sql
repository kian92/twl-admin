-- Add tour_type field to experience_packages table
-- Supports both group tours (join scheduled departures) and private tours (exclusive bookings)

-- Add tour_type column with default 'group' for backwards compatibility
ALTER TABLE public.experience_packages
ADD COLUMN IF NOT EXISTS tour_type TEXT NOT NULL DEFAULT 'group'
CHECK (tour_type IN ('group', 'private'));

-- Add index for filtering by tour type
CREATE INDEX IF NOT EXISTS idx_packages_tour_type ON public.experience_packages(tour_type);

-- Add comment for documentation
COMMENT ON COLUMN public.experience_packages.tour_type IS 'Tour type: group (join scheduled departures with others) or private (exclusive booking)';

-- Note: All existing packages will default to 'group' which matches current system behavior
