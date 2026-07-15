-- Admin-editable FX rates used to cross-fill customer-facing selling prices
-- across USD/SGD/MYR. Replaces the previously hardcoded FX_USD_TO_MYR / FX_USD_TO_SGD
-- constants in lib/utils/currency-converter.ts.
CREATE TABLE IF NOT EXISTS public.fx_rates (
    currency_code TEXT PRIMARY KEY CHECK (currency_code IN ('SGD', 'MYR')),
    rate_to_usd NUMERIC NOT NULL CHECK (rate_to_usd > 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.fx_rates (currency_code, rate_to_usd)
VALUES ('SGD', 1.35), ('MYR', 4.7)
ON CONFLICT (currency_code) DO NOTHING;

ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view fx rates"
    ON public.fx_rates
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow admin to manage fx rates"
    ON public.fx_rates
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_profiles
            WHERE admin_profiles.id = auth.uid()
            AND admin_profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_profiles
            WHERE admin_profiles.id = auth.uid()
            AND admin_profiles.role = 'admin'
        )
    );

CREATE OR REPLACE FUNCTION public.update_fx_rates_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_fx_rates_timestamp
    BEFORE UPDATE ON public.fx_rates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_fx_rates_timestamp();

COMMENT ON TABLE public.fx_rates IS 'Admin-editable exchange rates (1 USD = rate_to_usd currency_code) used to cross-fill selling prices across USD/SGD/MYR';
COMMENT ON COLUMN public.fx_rates.rate_to_usd IS 'Units of currency_code equal to 1 USD, e.g. 4.7 for MYR';
