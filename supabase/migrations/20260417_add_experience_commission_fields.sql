ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS commission_group TEXT,
  ADD COLUMN IF NOT EXISTS commission_value_text TEXT;

COMMENT ON COLUMN public.experiences.commission_group IS 'Named commission bucket for the experience, e.g. Category 1, Category 2, or Custom';
COMMENT ON COLUMN public.experiences.commission_value_text IS 'Admin-facing commission display value for the experience, e.g. 3% or 10%';
