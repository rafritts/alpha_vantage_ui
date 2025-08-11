import type { RequestHandler } from '@sveltejs/kit';
import { callAlphaVantage } from '$lib/server/alphaVantage';

// GET /api/news-sentiment?tickers=AAPL,MSFT&limit=50&topics=technology&sort=LATEST&time_from=20240101T0000&time_to=20251231T2359
export const GET: RequestHandler = async ({ url }) => {
  const tickers = url.searchParams.get('tickers');
  const topics = url.searchParams.get('topics') ?? undefined; // optional
  const time_from = url.searchParams.get('time_from') ?? undefined; // optional
  const time_to = url.searchParams.get('time_to') ?? undefined; // optional
  const sort = url.searchParams.get('sort') ?? undefined; // optional: LATEST or EARLIEST
  const limitRaw = url.searchParams.get('limit'); // optional
  const limit = limitRaw ?? undefined; // pass-through to AV
  const limitNum = limitRaw != null ? Number(limitRaw) : undefined;

  if (!tickers && !topics) {
    return new Response(
      JSON.stringify({ error: 'Provide at least one of: tickers or topics' }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }

  const result = await callAlphaVantage('NEWS_SENTIMENT', {
    ...(tickers ? { tickers } : {}),
    ...(topics ? { topics } : {}),
    ...(time_from ? { time_from } : {}),
    ...(time_to ? { time_to } : {}),
    ...(sort ? { sort } : {}),
    ...(limit ? { limit } : {})
  });

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

  // Enforce limit locally if AV returns more than requested
  let payload: any = result.data ?? {};
  if (
    payload &&
    Array.isArray(payload.feed) &&
    typeof limitNum === 'number' &&
    Number.isFinite(limitNum) &&
    limitNum > 0
  ) {
    payload = { ...payload, feed: payload.feed.slice(0, limitNum) };
  }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
};
