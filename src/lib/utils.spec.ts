import { describe, it, expect } from 'vitest';
import { formatValue } from './utils';

describe('formatValue', () => {
	it('returns N/A for nullish or empty-like values', () => {
		expect(formatValue('any', null)).toBe('N/A');
		expect(formatValue('any', undefined)).toBe('N/A');
		expect(formatValue('any', '')).toBe('N/A');
		expect(formatValue('any', 'None')).toBe('N/A');
	});

	it('passes through non-numeric keys unmodified', () => {
		expect(formatValue('symbol', 'AAPL')).toBe('AAPL');
		expect(formatValue('reportedCurrency', 'USD')).toBe('USD');
	});

	it('formats currency keys as USD', () => {
		expect(formatValue('totalRevenue', 1234567)).toBe('$1,234,567.00');
		expect(formatValue('netIncome', '2500')).toBe('$2,500.00');
	});

	it('formats percent keys and auto-scales ratios', () => {
		// already percent value
		expect(formatValue('profitMargin', 12.3456)).toBe('12.35%');
		// ratio that should scale to percent
		expect(formatValue('profitMargin', 0.123456)).toBe('12.35%');
	});

	it('formats generic numeric values with commas', () => {
		expect(formatValue('sharesOutstanding', 1234567)).toBe('1,234,567');
		expect(formatValue('someNumber', '9876543')).toBe('9,876,543');
	});

	it('returns original string for non-numeric unknown values', () => {
		expect(formatValue('unknown', 'abc123')).toBe('abc123');
	});
});
