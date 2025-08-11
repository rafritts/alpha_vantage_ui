import type { RequestHandler } from '@sveltejs/kit';
import type { AVFunction } from '$lib/server/alphaVantage';
import { callAlphaVantage } from '$lib/server/alphaVantage';

export const GET: RequestHandler = async ({ url }) => {
  const func = url.searchParams.get('function') as AVFunction | null;
  if (!func) {
    return new Response(
      JSON.stringify({ error: 'Missing required query param: function' }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }

  // Gather all params except 'function'
  const params: Record<string, string> = {};
  for (const [k, v] of url.searchParams.entries()) {
    if (k.toLowerCase() === 'function') continue;
    params[k] = v;
  }

  const result = await callAlphaVantage(func, params);

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
