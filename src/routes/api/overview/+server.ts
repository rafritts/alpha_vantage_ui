import type { RequestHandler } from '@sveltejs/kit';
import { callAlphaVantage } from '$lib/server/alphaVantage';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const symbol = url.searchParams.get('symbol');
	if (!symbol) {
		return new Response(JSON.stringify({ error: 'Missing required query param: symbol' }), {
			status: 400,
			headers: { 'content-type': 'application/json' }
		});
	}

	// Use reusable client; pass through SvelteKit fetch for SSR parity
	const result = await callAlphaVantage('OVERVIEW', { symbol });

	if (result.text && !result.data) {
		// Non-JSON response from upstream
		return new Response(result.text, {
			status: result.status,
			headers: { 'content-type': 'text/plain' }
		});
	}

	if (!result.ok) {
		return new Response(
			JSON.stringify(
				result.data ?? {
					error: result.error ?? 'Alpha Vantage request failed',
					details: result.upstreamNote
				}
			),
			{ status: result.status, headers: { 'content-type': 'application/json' } }
		);
	}

	return new Response(JSON.stringify(result.data ?? {}), {
		status: 200,
		headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
	});
};
