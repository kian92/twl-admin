export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimals: 2 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', decimals: 2 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimals: 2 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimals: 0 },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimals: 0 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimals: 0 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimals: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimals: 2 },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', decimals: 0 },
];

export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code);
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  if (!currency) {
    return `${currencyCode} ${Math.floor(amount)}`;
  }
  const decimals = currencyCode === 'USD' ? 0 : currency.decimals;
    
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.floor(amount));

}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  return currency?.symbol || currencyCode;
}
