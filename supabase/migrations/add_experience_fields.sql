-- Add new fields to experiences table to match consumer-facing structure

-- Add array fields for exclusions, not_suitable_for, what_to_bring, and gallery
ALTER TABLE experiences
  ADD COLUMN IF NOT EXISTS exclusions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS not_suitable_for TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS what_to_bring TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';

-- Add text field for meeting_point
ALTER TABLE experiences
  ADD COLUMN IF NOT EXISTS meeting_point TEXT;

-- Add JSON field for faqs
ALTER TABLE experiences
  ADD COLUMN IF NOT EXISTS faqs JSONB;

-- Add comments to document the new fields
COMMENT ON COLUMN experiences.exclusions IS 'List of items/services not included in the experience';
COMMENT ON COLUMN experiences.not_suitable_for IS 'List of restrictions (e.g., pregnant women, people with mobility issues)';
COMMENT ON COLUMN experiences.what_to_bring IS 'List of items travelers should bring';
COMMENT ON COLUMN experiences.meeting_point IS 'Location where experience starts';
COMMENT ON COLUMN experiences.gallery IS 'Additional images for the experience gallery';
COMMENT ON COLUMN experiences.faqs IS 'Frequently asked questions as JSON array: [{question: string, answer: string}]';
