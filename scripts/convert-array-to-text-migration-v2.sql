-- Migration: Ensure highlights, inclusions, exclusions are text type (not arrays)
-- This migration safely handles both text[] and text column types

-- Check current column types and convert if needed
DO $$
DECLARE
    highlights_type text;
    inclusions_type text;
    exclusions_type text;
BEGIN
    -- Get current data types
    SELECT data_type INTO highlights_type
    FROM information_schema.columns
    WHERE table_name = 'experiences' AND column_name = 'highlights';

    SELECT data_type INTO inclusions_type
    FROM information_schema.columns
    WHERE table_name = 'experiences' AND column_name = 'inclusions';

    SELECT data_type INTO exclusions_type
    FROM information_schema.columns
    WHERE table_name = 'experiences' AND column_name = 'exclusions';

    -- Convert highlights if it's an array
    IF highlights_type = 'ARRAY' THEN
        RAISE NOTICE 'Converting highlights from array to text...';

        ALTER TABLE public.experiences ADD COLUMN highlights_new text;

        UPDATE public.experiences
        SET highlights_new = CASE
            WHEN highlights IS NOT NULL AND array_length(highlights, 1) > 0
            THEN array_to_string(highlights, E'\n')
            ELSE NULL
        END;

        ALTER TABLE public.experiences DROP COLUMN highlights;
        ALTER TABLE public.experiences RENAME COLUMN highlights_new TO highlights;
    ELSE
        RAISE NOTICE 'highlights is already text type, skipping...';
    END IF;

    -- Convert inclusions if it's an array
    IF inclusions_type = 'ARRAY' THEN
        RAISE NOTICE 'Converting inclusions from array to text...';

        ALTER TABLE public.experiences ADD COLUMN inclusions_new text;

        UPDATE public.experiences
        SET inclusions_new = CASE
            WHEN inclusions IS NOT NULL AND array_length(inclusions, 1) > 0
            THEN array_to_string(inclusions, E'\n')
            ELSE NULL
        END;

        ALTER TABLE public.experiences DROP COLUMN inclusions;
        ALTER TABLE public.experiences RENAME COLUMN inclusions_new TO inclusions;
    ELSE
        RAISE NOTICE 'inclusions is already text type, skipping...';
    END IF;

    -- Convert exclusions if it's an array
    IF exclusions_type = 'ARRAY' THEN
        RAISE NOTICE 'Converting exclusions from array to text...';

        ALTER TABLE public.experiences ADD COLUMN exclusions_new text;

        UPDATE public.experiences
        SET exclusions_new = CASE
            WHEN exclusions IS NOT NULL AND array_length(exclusions, 1) > 0
            THEN array_to_string(exclusions, E'\n')
            ELSE NULL
        END;

        ALTER TABLE public.experiences DROP COLUMN exclusions;
        ALTER TABLE public.experiences RENAME COLUMN exclusions_new TO exclusions;
    ELSE
        RAISE NOTICE 'exclusions is already text type, skipping...';
    END IF;

    RAISE NOTICE 'Migration completed successfully!';
END $$;

-- Add helpful comments
COMMENT ON COLUMN public.experiences.highlights IS 'Highlights in HTML format (bullet lists, formatted text)';
COMMENT ON COLUMN public.experiences.inclusions IS 'Inclusions in HTML format (bullet lists, formatted text)';
COMMENT ON COLUMN public.experiences.exclusions IS 'Exclusions in HTML format (bullet lists, formatted text)';

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
