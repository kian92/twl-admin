-- Add is_destination_featured column to experiences table
ALTER TABLE experiences 
ADD COLUMN IF NOT EXISTS is_destination_featured boolean DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN experiences.is_destination_featured IS 'When true, this experience image will be used as the destination/country image';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_experiences_destination_featured 
ON experiences(country, is_destination_featured) 
WHERE is_destination_featured = true AND status = 'active';
