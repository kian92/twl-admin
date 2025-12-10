-- Create payment_links table
CREATE TABLE IF NOT EXISTS public.payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    destination TEXT NOT NULL,
    destination_description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    link_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER,
    current_uses INTEGER NOT NULL DEFAULT 0,
    custom_fields JSONB,
    image_url TEXT,
    billing_type TEXT NOT NULL DEFAULT 'one_time' CHECK (billing_type IN ('one_time', 'recurring')),
    recurring_interval TEXT CHECK (recurring_interval IN ('month', 'year') OR recurring_interval IS NULL),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on link_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_links_link_code ON public.payment_links(link_code);

-- Create index on created_by for filtering by user
CREATE INDEX IF NOT EXISTS idx_payment_links_created_by ON public.payment_links(created_by);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON public.payment_links(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_payment_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER payment_links_updated_at
BEFORE UPDATE ON public.payment_links
FOR EACH ROW
EXECUTE FUNCTION public.update_payment_links_updated_at();
