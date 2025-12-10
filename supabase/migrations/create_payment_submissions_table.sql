-- Create payment_submissions table to store user information for payment link submissions
CREATE TABLE IF NOT EXISTS payment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_link_id UUID NOT NULL REFERENCES payment_links(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,

  -- User Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_country_code TEXT NOT NULL DEFAULT '+1',
  phone_number TEXT NOT NULL,

  -- Travel Details
  travel_date DATE NOT NULL,
  travelers INTEGER NOT NULL DEFAULT 1,
  notes TEXT,

  -- Payment Details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
  receipt_url TEXT, -- Stripe receipt PDF URL

  -- Metadata
  agree_to_terms BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_payment_submissions_payment_link_id ON payment_submissions(payment_link_id);
CREATE INDEX idx_payment_submissions_email ON payment_submissions(email);
CREATE INDEX idx_payment_submissions_stripe_session_id ON payment_submissions(stripe_session_id);
CREATE INDEX idx_payment_submissions_payment_status ON payment_submissions(payment_status);
CREATE INDEX idx_payment_submissions_created_at ON payment_submissions(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE payment_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to view all submissions
CREATE POLICY "Admins can view all payment submissions"
  ON payment_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.is_active = true
    )
  );

-- Create policy to allow anyone to insert (for public payment form)
CREATE POLICY "Anyone can create payment submissions"
  ON payment_submissions
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow system updates (for webhook updates)
CREATE POLICY "System can update payment submissions"
  ON payment_submissions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_payment_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_submissions_updated_at
  BEFORE UPDATE ON payment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_submissions_updated_at();
