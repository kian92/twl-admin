-- Create package_blocked_dates table for managing unavailable tour dates
CREATE TABLE IF NOT EXISTS package_blocked_dates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID NOT NULL REFERENCES experience_packages(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure start_date is before or equal to end_date
    CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

-- Create indexes for better query performance
CREATE INDEX idx_blocked_dates_package_id ON package_blocked_dates(package_id);
CREATE INDEX idx_blocked_dates_date_range ON package_blocked_dates(start_date, end_date);
CREATE INDEX idx_blocked_dates_created_by ON package_blocked_dates(created_by);

-- Add RLS policies
ALTER TABLE package_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view blocked dates
CREATE POLICY "Allow authenticated users to view blocked dates"
    ON package_blocked_dates
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow admin, manager, and supplier roles to manage blocked dates
CREATE POLICY "Allow admin/manager/supplier to manage blocked dates"
    ON package_blocked_dates
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role IN ('admin', 'manager', 'supplier')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role IN ('admin', 'manager', 'supplier')
        )
    );

-- Create function to check if a date is blocked
CREATE OR REPLACE FUNCTION is_date_blocked(
    p_package_id UUID,
    p_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM package_blocked_dates
        WHERE package_id = p_package_id
        AND p_date BETWEEN start_date AND end_date
    );
END;
$$;

-- Create function to get blocked dates for a package within a date range
CREATE OR REPLACE FUNCTION get_blocked_dates(
    p_package_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    id UUID,
    start_date DATE,
    end_date DATE,
    reason TEXT,
    notes TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pbd.id,
        pbd.start_date,
        pbd.end_date,
        pbd.reason,
        pbd.notes
    FROM package_blocked_dates pbd
    WHERE pbd.package_id = p_package_id
    AND (
        -- Block overlaps with requested range
        (pbd.start_date BETWEEN p_start_date AND p_end_date)
        OR (pbd.end_date BETWEEN p_start_date AND p_end_date)
        OR (pbd.start_date <= p_start_date AND pbd.end_date >= p_end_date)
    )
    ORDER BY pbd.start_date;
END;
$$;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blocked_dates_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_blocked_dates_timestamp
    BEFORE UPDATE ON package_blocked_dates
    FOR EACH ROW
    EXECUTE FUNCTION update_blocked_dates_timestamp();

-- Add comment for documentation
COMMENT ON TABLE package_blocked_dates IS 'Stores blocked/unavailable dates for tour packages where bookings should not be allowed';
COMMENT ON COLUMN package_blocked_dates.reason IS 'Reason for blocking (e.g., Holiday, Maintenance, Weather, Staff Unavailable)';
COMMENT ON COLUMN package_blocked_dates.notes IS 'Internal notes/comments about the blocked dates';
COMMENT ON FUNCTION is_date_blocked(UUID, DATE) IS 'Returns true if the specified date is blocked for the given package';
COMMENT ON FUNCTION get_blocked_dates(UUID, DATE, DATE) IS 'Returns all blocked date ranges that overlap with the specified date range for a package';
