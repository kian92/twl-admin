-- Backfill multi-currency selling prices for tiers and addons created before
-- the multi-currency JSONB column existed (or saved without all three currencies).
--
-- FX rates used:
--   1 USD = 4.70 MYR
--   1 USD = 1.35 SGD
--   => derived: 1 SGD ≈ 3.48 MYR, 1 MYR ≈ 0.213 SGD
--
-- Strategy: for each row, take the currency that is non-zero (preferring the
-- row's own `currency` column as the source of truth) and fill the other two
-- by converting through USD. Existing non-zero values are preserved.

WITH rates AS (
  SELECT
    4.70::numeric AS usd_to_myr,
    1.35::numeric AS usd_to_sgd
)
UPDATE public.package_pricing_tiers AS pt
SET selling_prices = jsonb_build_object(
  'USD', FLOOR(
           COALESCE(
             NULLIF((pt.selling_prices->>'USD')::numeric, 0),
             CASE WHEN pt.currency = 'USD' THEN pt.selling_price END,
             NULLIF((pt.selling_prices->>'SGD')::numeric, 0) / r.usd_to_sgd,
             NULLIF((pt.selling_prices->>'MYR')::numeric, 0) / r.usd_to_myr,
             CASE WHEN pt.currency = 'SGD' THEN pt.selling_price / r.usd_to_sgd END,
             CASE WHEN pt.currency = 'MYR' THEN pt.selling_price / r.usd_to_myr END,
             0
           )
         )::int,
  'SGD', FLOOR(
           COALESCE(
             NULLIF((pt.selling_prices->>'SGD')::numeric, 0),
             CASE WHEN pt.currency = 'SGD' THEN pt.selling_price END,
             NULLIF((pt.selling_prices->>'USD')::numeric, 0) * r.usd_to_sgd,
             CASE WHEN pt.currency = 'USD' THEN pt.selling_price * r.usd_to_sgd END,
             NULLIF((pt.selling_prices->>'MYR')::numeric, 0) / r.usd_to_myr * r.usd_to_sgd,
             CASE WHEN pt.currency = 'MYR' THEN pt.selling_price / r.usd_to_myr * r.usd_to_sgd END,
             0
           )
         )::int,
  'MYR', FLOOR(
           COALESCE(
             NULLIF((pt.selling_prices->>'MYR')::numeric, 0),
             CASE WHEN pt.currency = 'MYR' THEN pt.selling_price END,
             NULLIF((pt.selling_prices->>'USD')::numeric, 0) * r.usd_to_myr,
             CASE WHEN pt.currency = 'USD' THEN pt.selling_price * r.usd_to_myr END,
             NULLIF((pt.selling_prices->>'SGD')::numeric, 0) / r.usd_to_sgd * r.usd_to_myr,
             CASE WHEN pt.currency = 'SGD' THEN pt.selling_price / r.usd_to_sgd * r.usd_to_myr END,
             0
           )
         )::int
)
FROM rates r
WHERE pt.selling_price IS NOT NULL
  AND pt.selling_price > 0
  AND (
    (pt.selling_prices->>'USD')::numeric = 0
    OR (pt.selling_prices->>'SGD')::numeric = 0
    OR (pt.selling_prices->>'MYR')::numeric = 0
  );

-- Same backfill for addons (column: prices_by_currency, scalar: price)
WITH rates AS (
  SELECT
    4.70::numeric AS usd_to_myr,
    1.35::numeric AS usd_to_sgd
)
UPDATE public.package_addons AS a
SET prices_by_currency = jsonb_build_object(
  'USD', FLOOR(
           COALESCE(
             NULLIF((a.prices_by_currency->>'USD')::numeric, 0),
             CASE WHEN a.currency = 'USD' THEN a.price END,
             NULLIF((a.prices_by_currency->>'SGD')::numeric, 0) / r.usd_to_sgd,
             NULLIF((a.prices_by_currency->>'MYR')::numeric, 0) / r.usd_to_myr,
             CASE WHEN a.currency = 'SGD' THEN a.price / r.usd_to_sgd END,
             CASE WHEN a.currency = 'MYR' THEN a.price / r.usd_to_myr END,
             0
           )
         )::int,
  'SGD', FLOOR(
           COALESCE(
             NULLIF((a.prices_by_currency->>'SGD')::numeric, 0),
             CASE WHEN a.currency = 'SGD' THEN a.price END,
             NULLIF((a.prices_by_currency->>'USD')::numeric, 0) * r.usd_to_sgd,
             CASE WHEN a.currency = 'USD' THEN a.price * r.usd_to_sgd END,
             NULLIF((a.prices_by_currency->>'MYR')::numeric, 0) / r.usd_to_myr * r.usd_to_sgd,
             CASE WHEN a.currency = 'MYR' THEN a.price / r.usd_to_myr * r.usd_to_sgd END,
             0
           )
         )::int,
  'MYR', FLOOR(
           COALESCE(
             NULLIF((a.prices_by_currency->>'MYR')::numeric, 0),
             CASE WHEN a.currency = 'MYR' THEN a.price END,
             NULLIF((a.prices_by_currency->>'USD')::numeric, 0) * r.usd_to_myr,
             CASE WHEN a.currency = 'USD' THEN a.price * r.usd_to_myr END,
             NULLIF((a.prices_by_currency->>'SGD')::numeric, 0) / r.usd_to_sgd * r.usd_to_myr,
             CASE WHEN a.currency = 'SGD' THEN a.price / r.usd_to_sgd * r.usd_to_myr END,
             0
           )
         )::int
)
FROM rates r
WHERE a.price IS NOT NULL
  AND a.price > 0
  AND (
    (a.prices_by_currency->>'USD')::numeric = 0
    OR (a.prices_by_currency->>'SGD')::numeric = 0
    OR (a.prices_by_currency->>'MYR')::numeric = 0
  );
