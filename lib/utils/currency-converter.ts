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

// FX rates used to cross-fill missing customer-facing currency prices.
// Keep in sync with supabase/migrations/20260515_backfill_multi_currency_selling_prices.sql.
export const FX_USD_TO_MYR = 4.7;
export const FX_USD_TO_SGD = 1.35;

export type MultiCurrencyPrices = { USD: number; SGD: number; MYR: number };

/**
 * If at least one of USD/SGD/MYR has a value, fill the missing (=0) currencies
 * by converting through USD using FX_USD_TO_MYR / FX_USD_TO_SGD.
 * Existing non-zero values are preserved. Outputs are floored (no decimals).
 */
export function crossFillByFx(prices: MultiCurrencyPrices): MultiCurrencyPrices {
  const usd = Number(prices.USD) || 0;
  const sgd = Number(prices.SGD) || 0;
  const myr = Number(prices.MYR) || 0;

  // Derive a USD reference from whichever currency is set.
  let usdRef = usd;
  if (!usdRef && sgd) usdRef = sgd / FX_USD_TO_SGD;
  if (!usdRef && myr) usdRef = myr / FX_USD_TO_MYR;

  if (!usdRef) return { USD: 0, SGD: 0, MYR: 0 };

  return {
    USD: usd || Math.floor(usdRef),
    SGD: sgd || Math.floor(usdRef * FX_USD_TO_SGD),
    MYR: myr || Math.floor(usdRef * FX_USD_TO_MYR),
  };
}
