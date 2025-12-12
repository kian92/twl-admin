-- Create testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_name TEXT NOT NULL,
    author_location TEXT,
    tour_name TEXT,
    tour_date TEXT,
    content TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('instagram', 'facebook', 'twitter', 'google', 'website', 'email', 'other')),
    social_media_url TEXT,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_testimonials_is_featured ON public.testimonials(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_testimonials_is_active ON public.testimonials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON public.testimonials(display_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_testimonials_updated_at();
