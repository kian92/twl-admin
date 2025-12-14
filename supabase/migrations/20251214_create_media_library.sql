-- Create media_library table for storing uploaded images and videos
CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' or 'video'
  mime_type TEXT NOT NULL, -- e.g., 'image/jpeg', 'video/mp4'
  file_size INTEGER, -- in bytes
  cdn_url TEXT NOT NULL, -- Bunny CDN URL
  bunny_video_id TEXT, -- For videos uploaded to Bunny Stream
  thumbnail_url TEXT, -- Thumbnail URL (auto-generated for videos)
  width INTEGER, -- Image/video width in pixels
  height INTEGER, -- Image/video height in pixels
  duration INTEGER, -- Video duration in seconds
  tags TEXT[], -- Array of tags for categorization
  is_public BOOLEAN DEFAULT true, -- Whether to show on consumer site
  display_order INTEGER DEFAULT 0, -- For ordering in galleries
  uploaded_by TEXT, -- Admin user who uploaded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_media_library_file_type ON public.media_library(file_type);
CREATE INDEX IF NOT EXISTS idx_media_library_is_public ON public.media_library(is_public);
CREATE INDEX IF NOT EXISTS idx_media_library_created_at ON public.media_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_library_display_order ON public.media_library(display_order);
CREATE INDEX IF NOT EXISTS idx_media_library_tags ON public.media_library USING GIN(tags);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_media_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_media_library_updated_at
  BEFORE UPDATE ON public.media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_media_library_updated_at();

-- Add comments
COMMENT ON TABLE public.media_library IS 'Media library for storing uploaded images and videos';
COMMENT ON COLUMN public.media_library.file_type IS 'Type of media: image or video';
COMMENT ON COLUMN public.media_library.cdn_url IS 'Full CDN URL from Bunny.net';
COMMENT ON COLUMN public.media_library.bunny_video_id IS 'Video ID from Bunny Stream (for videos only)';
COMMENT ON COLUMN public.media_library.is_public IS 'Whether to display on consumer-facing site';
COMMENT ON COLUMN public.media_library.display_order IS 'Order for displaying in galleries (lower = first)';
