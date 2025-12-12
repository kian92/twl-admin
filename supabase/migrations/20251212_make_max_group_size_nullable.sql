-- Make max_group_size nullable to support unlimited group sizes
ALTER TABLE experiences
ALTER COLUMN max_group_size DROP NOT NULL;

-- Add comment to document the intention
COMMENT ON COLUMN experiences.max_group_size IS 'Maximum group size. NULL indicates unlimited group size.';
