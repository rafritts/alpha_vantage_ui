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
	'costOfRevenueForJcr',
	// Cash Flow API common monetary fields
	'operatingCashflow',
	'capitalExpenditures',
	'cashflowFromInvestment',
	'cashflowFromFinancing',
	'dividendPayout',
	'dividendPayoutCommonStock',
	'dividendPayoutPreferredStock',
	'changeInCashAndCashEquivalents',
	'profitLoss',
	// Cash flow often repeats netIncome
	'netIncome',
	// Additional frequent cash flow monetary movements
	'depreciationDepletionAndAmortization',
	'changeInOperatingAssets',
	'changeInOperatingLiabilities',
	'changeInInventory',
	'changeInAccountsReceivable',
	'changeInAccountsPayable',
	'proceedsFromIssuanceOfLongTermDebtAndCapitalSecuritiesNet',
	'debtRepayment',
	'paymentsForRepurchaseOfCommonStock',
	'paymentsForRepurchaseOfEquity',
	'paymentsForRepurchaseOfPreferredStock',
	'commonStockIssuance',
	'commonStockRepurchased',
	'interestPaid'
]);

// A set of keys that are not numeric and should not be formatted.
const nonNumericKeys = new Set(['fiscalDateEnding', 'reportedCurrency', 'symbol']);

// Keys that represent percentages. When values are <= 1 in magnitude, treat as ratio and scale to %.
const percentKeys = new Set([
	// Common financial percent-like fields (mostly appear in overview; kept generic for reuse)
	'dividendYield',
	'profitMargin',
	'operatingMargin',
	'grossMargin',
	'returnOnAssets',
	'returnOnEquity',
	'returnOnInvestedCapital',
	'payoutRatio',
	'quarterlyRevenueGrowthYOY',
	'quarterlyEarningsGrowthYOY'
]);

function formatPercent(num: number): string {
	const value = Math.abs(num) <= 1 ? num * 100 : num;
	return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)}%`;
}

/**
 * Formats a value based on its key.
 * - If the key is in `currencyKeys`, it formats it as USD currency.
 * - If the key is in `percentKeys`, it formats it as a percentage (auto scales ratios).
 * - If the key looks percent-like by name (e.g., contains percent/margin/yield/ratio), format as %.
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

	if (percentKeys.has(key) || /percent|margin|yield|ratio/i.test(key)) {
		return formatPercent(num);
	}

	// Default to formatting with commas for other numeric values
	return new Intl.NumberFormat('en-US').format(num);
}
