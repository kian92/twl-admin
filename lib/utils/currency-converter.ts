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
