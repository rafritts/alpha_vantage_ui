// A set of keys that should be formatted as currency.
const currencyKeys = new Set([
  'totalRevenue',
  'grossProfit',
  'operatingIncome',
  'netIncome',
  'ebit',
  'ebitda',
  'totalAssets',
  'totalLiabilities',
  'totalShareholderEquity',
  'cashAndCashEquivalentsAtCarryingValue',
  'commonStock',
  'retainedEarnings',
  'longTermDebt',
  'shortTermDebt',
  'researchAndDevelopment',
  'operatingExpenses',
  'costOfRevenueForJcr'
]);

// A set of keys that are not numeric and should not be formatted.
const nonNumericKeys = new Set([
  'fiscalDateEnding',
  'reportedCurrency',
  'symbol'
]);

/**
 * Formats a value based on its key.
 * - If the key is in `currencyKeys`, it formats it as USD currency.
 * - If the key is in `nonNumericKeys`, it returns the value as is.
 * - Otherwise, it formats the number with commas.
 * @param key The key of the value to format.
 * @param value The value to format.
 * @returns The formatted value as a string.
 */
export function formatValue(key: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === 'None' || value === '') {
    return 'N/A';
  }

  if (nonNumericKeys.has(key)) {
    return String(value);
  }

  const num = Number(value);
  if (isNaN(num)) {
    return String(value);
  }

  if (currencyKeys.has(key)) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  }

  // Default to formatting with commas for other numeric values
  return new Intl.NumberFormat('en-US').format(num);
}
