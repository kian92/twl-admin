-- Add requires_full_payment field to experience_packages table
-- This field indicates whether a package requires full payment upfront

ALTER TABLE experience_packages
ADD COLUMN requires_full_payment BOOLEAN DEFAULT false NOT NULL;

-- Add comment to describe the column
COMMENT ON COLUMN experience_packages.requires_full_payment IS 'Indicates whether this package requires full payment upfront instead of a deposit';
