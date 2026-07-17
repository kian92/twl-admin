/**
 * Currency conversion utilities
 */

/**
 * Convert amount from supplier currency to USD using exchange rate
 * @param amount Amount in supplier currency
 * @param exchangeRate Exchange rate (1 supplier_currency = X USD)
 * @returns Amount in USD
 */
export function convertToUSD(amount: number, exchangeRate: number): number {
  if (!amount || !exchangeRate || exchangeRate <= 0) return 0;
  return amount * exchangeRate;
}

/**
 * Convert amount from USD to supplier currency using exchange rate
 * @param usdAmount Amount in USD
 * @param exchangeRate Exchange rate (1 supplier_currency = X USD)
 * @returns Amount in supplier currency
 */
export function convertFromUSD(usdAmount: number, exchangeRate: number): number {
  if (!usdAmount || !exchangeRate || exchangeRate <= 0) return 0;
  return usdAmount / exchangeRate;
}

/**
 * Calculate exchange rate from supplier currency amount and USD amount
 * @param supplierAmount Amount in supplier currency
 * @param usdAmount Equivalent amount in USD
 * @returns Exchange rate (1 supplier_currency = X USD)
 */
export function calculateExchangeRate(supplierAmount: number, usdAmount: number): number {
  if (!supplierAmount || supplierAmount === 0) return 1;
  return usdAmount / supplierAmount;
}

/**
 * Validate exchange rate is within reasonable bounds
 * @param rate Exchange rate to validate
 * @returns true if rate is valid
 */
export function isValidExchangeRate(rate: number): boolean {
  // Exchange rates should be positive and within reasonable bounds
  // Most exchange rates are between 0.0001 and 10000
  return rate > 0 && rate < 100000;
}

/**
 * Round currency amount to appropriate decimal places
 * @param amount Amount to round
 * @param decimals Number of decimal places (default: 2)
 * @returns Rounded amount
 */
export function roundCurrency(amount: number, decimals: number = 2): number {
  return Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Fallback FX rates used to cross-fill missing customer-facing currency prices
// when no admin-configured rate is available (see public.fx_rates / getFxRates).
// Keep in sync with supabase/migrations/20260515_backfill_multi_currency_selling_prices.sql.
export const FX_USD_TO_MYR = 4.7;
export const FX_USD_TO_SGD = 1.35;

export type MultiCurrencyPrices = { USD: number; SGD: number; MYR: number };
export type FxRates = { usdToSgd: number; usdToMyr: number };

export const DEFAULT_FX_RATES: FxRates = {
  usdToSgd: FX_USD_TO_SGD,
  usdToMyr: FX_USD_TO_MYR,
};

/**
 * If at least one of USD/SGD/MYR has a value, fill the missing (=0) currencies
 * by converting through USD using the given (or default) FX rates.
 * Existing non-zero values are preserved. Outputs are floored (no decimals).
 *
 * @deprecated Prefer deriveByFx, which always recomputes the non-reference
 * currencies instead of trusting whatever was previously stored for them —
 * this avoids stale/inconsistent values getting "frozen" across saves.
 */
export function crossFillByFx(
  prices: MultiCurrencyPrices,
  rates: FxRates = DEFAULT_FX_RATES
): MultiCurrencyPrices {
  const usd = Number(prices.USD) || 0;
  const sgd = Number(prices.SGD) || 0;
  const myr = Number(prices.MYR) || 0;
  const { usdToSgd, usdToMyr } = rates;

  // Derive a USD reference from whichever currency is set.
  let usdRef = usd;
  if (!usdRef && sgd) usdRef = sgd / usdToSgd;
  if (!usdRef && myr) usdRef = myr / usdToMyr;

  if (!usdRef) return { USD: 0, SGD: 0, MYR: 0 };

  return {
    USD: usd || Math.floor(usdRef),
    SGD: sgd || Math.floor(usdRef * usdToSgd),
    MYR: myr || Math.floor(usdRef * usdToMyr),
  };
}

/**
 * Derive USD/SGD/MYR prices from a single reference currency + amount, using
 * the given (or default) FX rates. Unlike crossFillByFx, this always
 * recomputes the two non-reference currencies — it never trusts a
 * previously stored value for them, so stale/inconsistent data can't persist
 * across saves. The reference currency's own value is returned unchanged.
 */
export function deriveByFx(
  referenceCurrency: keyof MultiCurrencyPrices,
  referenceAmount: number,
  rates: FxRates = DEFAULT_FX_RATES
): MultiCurrencyPrices {
  const amount = Number(referenceAmount) || 0;
  const { usdToSgd, usdToMyr } = rates;

  if (!amount) return { USD: 0, SGD: 0, MYR: 0 };

  const usdRef =
    referenceCurrency === 'USD' ? amount :
    referenceCurrency === 'SGD' ? amount / usdToSgd :
    amount / usdToMyr;

  return {
    USD: referenceCurrency === 'USD' ? amount : Math.floor(usdRef),
    SGD: referenceCurrency === 'SGD' ? amount : Math.floor(usdRef * usdToSgd),
    MYR: referenceCurrency === 'MYR' ? amount : Math.floor(usdRef * usdToMyr),
  };
}

/**
 * Fetch the admin-configured FX rates from public.fx_rates, falling back to
 * DEFAULT_FX_RATES for any currency missing a row or on query failure.
 */
export async function getFxRates(supabase: {
  from: (table: string) => any;
}): Promise<FxRates> {
  const { data, error } = await supabase
    .from('fx_rates')
    .select('currency_code, rate_to_usd');

  if (error || !data) return DEFAULT_FX_RATES;

  const sgdRow = data.find((row: any) => row.currency_code === 'SGD');
  const myrRow = data.find((row: any) => row.currency_code === 'MYR');

  return {
    usdToSgd: sgdRow && isValidExchangeRate(Number(sgdRow.rate_to_usd)) ? Number(sgdRow.rate_to_usd) : DEFAULT_FX_RATES.usdToSgd,
    usdToMyr: myrRow && isValidExchangeRate(Number(myrRow.rate_to_usd)) ? Number(myrRow.rate_to_usd) : DEFAULT_FX_RATES.usdToMyr,
  };
}
