-- Add experience_id column to testimonials table to link testimonials to specific experiences
ALTER TABLE public.testimonials
ADD COLUMN IF NOT EXISTS experience_id UUID REFERENCES public.experiences(id) ON DELETE SET NULL;

-- Add index for better query performance when fetching testimonials by experience
CREATE INDEX IF NOT EXISTS idx_testimonials_experience_id ON public.testimonials(experience_id);

-- Add comment to document the column
COMMENT ON COLUMN public.testimonials.experience_id IS 'Foreign key to experiences table - links testimonial to a specific experience/tour';
