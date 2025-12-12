-- Make max_group_size nullable in experience_packages table to support unlimited group sizes
ALTER TABLE experience_packages
ALTER COLUMN max_group_size DROP NOT NULL,
ALTER COLUMN max_group_size DROP DEFAULT;

-- Add comment to document the intention
COMMENT ON COLUMN experience_packages.max_group_size IS 'Maximum group size. NULL indicates unlimited group size.';
