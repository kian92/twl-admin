-- Migration: Convert highlights, inclusions, exclusions from text[] to text
-- This migration changes array columns to text columns to support HTML content

-- Step 1: Add new temporary text columns
ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS highlights_new text,
ADD COLUMN IF NOT EXISTS inclusions_new text,
ADD COLUMN IF NOT EXISTS exclusions_new text;

-- Step 2: Copy data from array columns to new text columns
-- Convert arrays to newline-separated text (will be migrated to HTML later)
UPDATE public.experiences
SET
  highlights_new = CASE
    WHEN highlights IS NOT NULL AND array_length(highlights, 1) > 0
    THEN array_to_string(highlights, E'\n')
    ELSE NULL
  END,
  inclusions_new = CASE
    WHEN inclusions IS NOT NULL AND array_length(inclusions, 1) > 0
    THEN array_to_string(inclusions, E'\n')
    ELSE NULL
  END,
  exclusions_new = CASE
    WHEN exclusions IS NOT NULL AND array_length(exclusions, 1) > 0
    THEN array_to_string(exclusions, E'\n')
    ELSE NULL
  END;

-- Step 3: Drop old array columns
ALTER TABLE public.experiences
DROP COLUMN IF EXISTS highlights,
DROP COLUMN IF EXISTS inclusions,
DROP COLUMN IF EXISTS exclusions;

-- Step 4: Rename new columns to original names
ALTER TABLE public.experiences
RENAME COLUMN highlights_new TO highlights;

ALTER TABLE public.experiences
RENAME COLUMN inclusions_new TO inclusions;

ALTER TABLE public.experiences
RENAME COLUMN exclusions_new TO exclusions;

-- Step 5: Add helpful comments
COMMENT ON COLUMN public.experiences.highlights IS 'Highlights in HTML format (bullet lists, formatted text)';
COMMENT ON COLUMN public.experiences.inclusions IS 'Inclusions in HTML format (bullet lists, formatted text)';
COMMENT ON COLUMN public.experiences.exclusions IS 'Exclusions in HTML format (bullet lists, formatted text)';

-- Step 6: Reload schema cache
NOTIFY pgrst, 'reload schema';
