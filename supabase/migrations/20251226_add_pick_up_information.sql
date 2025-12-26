-- Add pick_up_information field to experiences table
ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS pick_up_information TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.experiences.pick_up_information IS 'Pick up details, instructions, and locations for the experience';
