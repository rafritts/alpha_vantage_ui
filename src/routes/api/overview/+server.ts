import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const symbol = url.searchParams.get('symbol');
	if (!symbol) {
		return new Response(JSON.stringify({ error: 'Missing required query param: symbol' }), {
			status: 400,
			headers: { 'content-type': 'application/json' }
		});
	}

	const apiKey = env.ALPHA_VANTAGE_API_KEY;
	if (!apiKey) {
		return new Response(
			JSON.stringify({ error: 'Server misconfigured: ALPHA_VANTAGE_API_KEY is not set' }),
			{ status: 500, headers: { 'content-type': 'application/json' } }
		);
	}

	const endpoint = new URL('https://www.alphavantage.co/query');
	endpoint.searchParams.set('function', 'OVERVIEW');
	endpoint.searchParams.set('symbol', symbol);
	endpoint.searchParams.set('apikey', apiKey);

	try {
		const resp = await fetch(endpoint.toString());
		const text = await resp.text();

		// Alpha Vantage sometimes returns 200 with an error note/body. Try to parse JSON.
		let data: unknown;
		try {
			data = JSON.parse(text);
		} catch {
			// Not JSON, forward as text
			return new Response(text, { status: resp.status, headers: { 'content-type': 'text/plain' } });
		}

		// If rate limited or error, AlphaVantage returns { Note: "..." } or { Information: "..." }
		const maybeObj = data as Record<string, unknown>;
		if (
			maybeObj &&
			(typeof maybeObj.Note === 'string' || typeof maybeObj.Information === 'string' || typeof maybeObj['Error Message'] === 'string')
		) {
			return new Response(JSON.stringify(maybeObj), {
				status: 429,
				headers: { 'content-type': 'application/json' }
			});
		}

		return new Response(JSON.stringify(data), {
			status: resp.ok ? 200 : resp.status,
			headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ error: 'Upstream fetch failed', details: err instanceof Error ? err.message : String(err) }),
			{ status: 502, headers: { 'content-type': 'application/json' } }
		);
	}
};
