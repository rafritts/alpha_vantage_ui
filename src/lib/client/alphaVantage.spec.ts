import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import after environment setup in each test when necessary
import { getApiKeyFromSession, callAlphaVantageBrowser } from './alphaVantage';

declare global {
  // eslint-disable-next-line no-var
  var sessionStorage: Storage | undefined;
}

function mockSessionStorage(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  const api: Storage = {
    get length() {
      return store.size;
    },
    clear: vi.fn(() => store.clear()),
    getItem: vi.fn((k: string) => (store.has(k) ? store.get(k)! : null)),
    key: vi.fn((i: number) => Array.from(store.keys())[i] ?? null),
    removeItem: vi.fn((k: string) => void store.delete(k)),
    setItem: vi.fn((k: string, v: string) => void store.set(k, String(v)))
  } as unknown as Storage;
  // @ts-expect-error test env global
  global.sessionStorage = api;
  return api;
}

function unmockSessionStorage() {
  // @ts-expect-error test env global
  delete global.sessionStorage;
}

function mockFetchOnce(res: { ok: boolean; status: number; body: string }) {
  const fakeResp = {
    ok: res.ok,
    status: res.status,
    text: vi.fn(async () => res.body)
  } as unknown as Response;
  const spy = vi.spyOn(global, 'fetch' as any).mockResolvedValueOnce(fakeResp);
  return spy;
}

describe('getApiKeyFromSession', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    unmockSessionStorage();
  });

  it('returns null when sessionStorage is not available', () => {
    unmockSessionStorage();
    expect(getApiKeyFromSession()).toBeNull();
  });

  it('returns stored api key from sessionStorage', () => {
    const ss = mockSessionStorage({ av_api_key: 'KEY123' });
    expect(getApiKeyFromSession()).toBe('KEY123');
    expect(ss.getItem).toHaveBeenCalledWith('av_api_key');
  });
});

describe('callAlphaVantageBrowser', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    unmockSessionStorage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    unmockSessionStorage();
  });

  it('fails early if no API key available', async () => {
    const res = await callAlphaVantageBrowser('OVERVIEW', {});
    expect(res.ok).toBe(false);
    expect(res.status).toBe(400);
    expect(res.error).toMatch(/Missing Alpha Vantage API key/i);
  });

  it('uses sessionStorage api key when not provided in params', async () => {
    mockSessionStorage({ av_api_key: 'FROM_SESSION' });
    const spy = mockFetchOnce({ ok: true, status: 200, body: JSON.stringify({ hello: 'world' }) });
    const res = await callAlphaVantageBrowser('OVERVIEW', { symbol: 'AAPL' }, 'https://example.test/query');
    expect(res).toEqual({ ok: true, status: 200, data: { hello: 'world' } });
    expect(spy).toHaveBeenCalledTimes(1);
    const calledUrl = (spy.mock.calls[0] as any[])[0] as string;
    expect(calledUrl).toContain('https://example.test/query');
    expect(calledUrl).toContain('function=OVERVIEW');
    expect(calledUrl).toContain('symbol=AAPL');
    expect(calledUrl).toContain('apikey=FROM_SESSION');
  });

  it('param apikey overrides sessionStorage api key', async () => {
    mockSessionStorage({ av_api_key: 'FROM_SESSION' });
    const spy = mockFetchOnce({ ok: true, status: 200, body: JSON.stringify({ ok: 1 }) });
    await callAlphaVantageBrowser('GLOBAL_QUOTE', { apikey: 'FROM_PARAM' });
    const calledUrl = (spy.mock.calls[0] as any[])[0] as string;
    expect(calledUrl).toContain('apikey=FROM_PARAM');
  });

  it('surfaces upstream Note/Information as a 429 with upstreamNote', async () => {
    mockSessionStorage({ av_api_key: 'KEY' });
    mockFetchOnce({ ok: true, status: 200, body: JSON.stringify({ Note: 'Please try again' }) });
    const res = await callAlphaVantageBrowser('OVERVIEW');
    expect(res.ok).toBe(false);
    expect(res.status).toBe(429);
    expect(res.upstreamNote).toBe('Please try again');
    expect(res.data).toEqual({ Note: 'Please try again' });
  });

  it('returns text when response is not JSON', async () => {
    mockSessionStorage({ av_api_key: 'KEY' });
    mockFetchOnce({ ok: true, status: 200, body: 'plain text response' });
    const res = await callAlphaVantageBrowser('OVERVIEW');
    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    expect(res.text).toBe('plain text response');
  });

  it('propagates http error status when not ok and JSON without note', async () => {
    mockSessionStorage({ av_api_key: 'KEY' });
    mockFetchOnce({ ok: false, status: 503, body: JSON.stringify({ error: 'down' }) });
    const res = await callAlphaVantageBrowser('OVERVIEW');
    expect(res.ok).toBe(false);
    expect(res.status).toBe(503);
    expect(res.data).toEqual({ error: 'down' });
  });

  it('returns error on fetch rejection', async () => {
    mockSessionStorage({ av_api_key: 'KEY' });
    vi.spyOn(global, 'fetch' as any).mockRejectedValueOnce(new Error('network fail'));
    const res = await callAlphaVantageBrowser('OVERVIEW');
    expect(res.ok).toBe(false);
    expect(res.status).toBe(0);
    expect(res.error).toMatch(/network fail/);
  });
});
