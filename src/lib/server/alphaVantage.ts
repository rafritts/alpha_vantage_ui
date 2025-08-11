import { env } from '$env/dynamic/private';

export type AVFunction =
  | 'OVERVIEW'
  | string; // allow any documented function while providing some known ones

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export interface AVClientOptions {
  baseUrl?: string;
}

export interface AVResult<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  text?: string;
  // If Alpha Vantage returns Note/Information/Error Message, expose here
  upstreamNote?: string;
  error?: string;
}

function buildUrl(base: string, params: QueryParams): string {
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

/**
 * Calls Alpha Vantage using server-side API key, handling its odd 200-with-error responses.
 * Returns JSON when possible, otherwise raw text.
 */
export async function callAlphaVantage<T = unknown>(func: AVFunction, params: QueryParams = {}, opts: AVClientOptions = {}): Promise<AVResult<T>> {
  const apiKey = env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      error: 'Server misconfigured: ALPHA_VANTAGE_API_KEY is not set'
    };
  }

  const baseUrl = opts.baseUrl ?? 'https://www.alphavantage.co/query';

  const url = buildUrl(baseUrl, {
    function: func,
    apikey: apiKey,
    ...params
  });

  try {
    const resp = await fetch(url);
    const text = await resp.text();

    // Try parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Not JSON
      return {
        ok: resp.ok,
        status: resp.status,
        text
      };
    }

    // AV sometimes returns informational error payloads with 200
    const maybe = parsed as Record<string, unknown>;
    const note =
      (maybe && typeof maybe.Note === 'string' && (maybe.Note as string)) ||
      (maybe && typeof maybe.Information === 'string' && (maybe.Information as string)) ||
      (maybe && typeof maybe['Error Message'] === 'string' && (maybe['Error Message'] as string)) ||
      undefined;

    if (note) {
      // Treat as rate limited or upstream error
      return {
        ok: false,
        status: 429,
        data: maybe as T,
        upstreamNote: note
      };
    }

    return {
      ok: resp.ok,
      status: resp.ok ? 200 : resp.status,
      data: parsed as T
    };
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
