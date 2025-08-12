import type { RequestHandler } from '@sveltejs/kit';
import { callAlphaVantage } from '$lib/server/alphaVantage';

// GET /api/earnings-history?symbol=AAPL
export const GET: RequestHandler = async ({ url }) => {
  const symbol = url.searchParams.get('symbol');
  if (!symbol) {
    return new Response(
      JSON.stringify({ error: 'Missing required query param: symbol' }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }

  const result = await callAlphaVantage('EARNINGS', { symbol });

  if (result.text && !result.data) {
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
