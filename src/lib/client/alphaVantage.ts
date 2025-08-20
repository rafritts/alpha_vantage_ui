export type AVFunction =
	| 'OVERVIEW'
	| 'GLOBAL_QUOTE'
	| 'INCOME_STATEMENT'
	| 'BALANCE_SHEET'
	| 'CASH_FLOW'
	| 'NEWS_SENTIMENT'
	| 'EARNINGS_CALL_TRANSCRIPT'
	| string;

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export interface AVResult<T = unknown> {
	ok: boolean;
	status: number;
	data?: T;
	text?: string;
	upstreamNote?: string;
	error?: string;
}

const STORAGE_KEY = 'av_api_key';

export function getApiKeyFromSession(): string | null {
	try {
		if (typeof sessionStorage !== 'undefined') {
			return sessionStorage.getItem(STORAGE_KEY);
		}
	} catch {}
	return null;
}

function buildUrl(base: string, params: QueryParams): string {
	const url = new URL(base);
	for (const [k, v] of Object.entries(params)) {
		if (v === undefined || v === null) continue;
		url.searchParams.set(k, String(v));
	}
	return url.toString();
}

export async function callAlphaVantageBrowser<T = unknown>(
	func: AVFunction,
	params: QueryParams = {},
	baseUrl = 'https://www.alphavantage.co/query'
): Promise<AVResult<T>> {
	const apiKey = (params.apikey as string | undefined) ?? getApiKeyFromSession() ?? undefined;
	if (!apiKey) {
		return { ok: false, status: 400, error: 'Missing Alpha Vantage API key in sessionStorage' };
	}

	const url = buildUrl(baseUrl, { function: func, apikey: apiKey, ...params });

	try {
		const resp = await fetch(url);
		const text = await resp.text();

		let parsed: unknown;
		try {
			parsed = JSON.parse(text);
		} catch {
			return { ok: resp.ok, status: resp.status, text };
		}

		const maybe = parsed as Record<string, any>;
		const note = maybe?.Note || maybe?.Information || maybe?.['Error Message'];
		if (typeof note === 'string' && note) {
			return { ok: false, status: 429, data: maybe as T, upstreamNote: note };
		}

		return { ok: resp.ok, status: resp.ok ? 200 : resp.status, data: parsed as T };
	} catch (err) {
		return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
	}
}
