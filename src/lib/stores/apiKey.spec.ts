import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { apiKeyStore } from './apiKey';

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
  // @ts-expect-error assign global for tests
  global.sessionStorage = api;
  return api;
}

function unmockSessionStorage() {
  // @ts-expect-error delete global for tests
  delete global.sessionStorage;
}

describe('apiKeyStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    unmockSessionStorage();
  });

  it('initializes from sessionStorage if present', () => {
    const ss = mockSessionStorage({ av_api_key: 'INIT' });
    // re-import module to re-run initialization with mocked storage
    vi.resetModules();
    // dynamic import to pick up fresh module state
    return import('./apiKey').then(({ apiKeyStore: fresh }) => {
      expect(get(fresh)).toBe('INIT');
      expect(ss.getItem).toHaveBeenCalledWith('av_api_key');
    });
  });

  it('persists updates to sessionStorage when available', async () => {
    const ss = mockSessionStorage();
    apiKeyStore.set('NEWKEY');
    expect(ss.setItem).toHaveBeenCalledWith('av_api_key', 'NEWKEY');

    apiKeyStore.set('');
    expect(ss.removeItem).toHaveBeenCalledWith('av_api_key');
  });

  it('does not throw when sessionStorage is unavailable', () => {
    unmockSessionStorage();
    expect(() => {
      apiKeyStore.set('ANY');
      apiKeyStore.set('');
    }).not.toThrow();
  });
});
