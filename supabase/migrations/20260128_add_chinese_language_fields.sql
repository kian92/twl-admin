-- =====================================================
-- Add Chinese Language Support Fields
-- =====================================================
-- Adds _zh suffix fields for dual-language support
-- English fields (without suffix) remain as default
-- =====================================================

-- Add Chinese fields to experiences table
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS title_zh TEXT,
  ADD COLUMN IF NOT EXISTS description_zh TEXT,
  ADD COLUMN IF NOT EXISTS location_zh TEXT,
  ADD COLUMN IF NOT EXISTS highlights_zh TEXT,
  ADD COLUMN IF NOT EXISTS inclusions_zh TEXT,
  ADD COLUMN IF NOT EXISTS exclusions_zh TEXT,
  ADD COLUMN IF NOT EXISTS pick_up_information_zh TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_policy_zh TEXT,
  ADD COLUMN IF NOT EXISTS meeting_point_zh TEXT;

-- Add Chinese array fields (stored as text arrays)
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS not_suitable_for_zh TEXT[],
  ADD COLUMN IF NOT EXISTS what_to_bring_zh TEXT[];

-- Add Chinese fields for itinerary and FAQs (stored as JSONB)
-- Structure: Same as English version but with Chinese text
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS itinerary_zh JSONB,
  ADD COLUMN IF NOT EXISTS faqs_zh JSONB;

-- Add Chinese fields to experience_packages table
ALTER TABLE public.experience_packages
  ADD COLUMN IF NOT EXISTS package_name_zh TEXT,
  ADD COLUMN IF NOT EXISTS description_zh TEXT,
  ADD COLUMN IF NOT EXISTS inclusions_zh TEXT[],
  ADD COLUMN IF NOT EXISTS exclusions_zh TEXT[];

-- Add Chinese fields to package_addons table
ALTER TABLE public.package_addons
  ADD COLUMN IF NOT EXISTS addon_name_zh TEXT,
  ADD COLUMN IF NOT EXISTS description_zh TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.experiences.title_zh IS 'Chinese translation of experience title';
COMMENT ON COLUMN public.experiences.description_zh IS 'Chinese translation of experience description';
COMMENT ON COLUMN public.experiences.location_zh IS 'Chinese translation of location name';
COMMENT ON COLUMN public.experiences.highlights_zh IS 'Chinese translation of highlights (rich text)';
COMMENT ON COLUMN public.experiences.inclusions_zh IS 'Chinese translation of inclusions (rich text)';
COMMENT ON COLUMN public.experiences.exclusions_zh IS 'Chinese translation of exclusions (rich text)';
COMMENT ON COLUMN public.experiences.pick_up_information_zh IS 'Chinese translation of pick-up information';
COMMENT ON COLUMN public.experiences.cancellation_policy_zh IS 'Chinese translation of cancellation policy';
COMMENT ON COLUMN public.experiences.meeting_point_zh IS 'Chinese translation of meeting point';
COMMENT ON COLUMN public.experiences.not_suitable_for_zh IS 'Chinese translation of not suitable for list';
COMMENT ON COLUMN public.experiences.what_to_bring_zh IS 'Chinese translation of what to bring list';
COMMENT ON COLUMN public.experiences.itinerary_zh IS 'Chinese translation of itinerary (same structure as English)';
COMMENT ON COLUMN public.experiences.faqs_zh IS 'Chinese translation of FAQs (same structure as English)';

COMMENT ON COLUMN public.experience_packages.package_name_zh IS 'Chinese translation of package name';
COMMENT ON COLUMN public.experience_packages.description_zh IS 'Chinese translation of package description';
COMMENT ON COLUMN public.experience_packages.inclusions_zh IS 'Chinese translation of package inclusions list';
COMMENT ON COLUMN public.experience_packages.exclusions_zh IS 'Chinese translation of package exclusions list';

COMMENT ON COLUMN public.package_addons.addon_name_zh IS 'Chinese translation of addon name';
COMMENT ON COLUMN public.package_addons.description_zh IS 'Chinese translation of addon description';
