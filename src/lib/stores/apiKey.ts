import { readable, writable, type Writable } from 'svelte/store';

const STORAGE_KEY = 'av_api_key';

function createSessionStorageBackedStore(): Writable<string> {
  let initial = '';
  try {
    if (typeof sessionStorage !== 'undefined') {
      initial = sessionStorage.getItem(STORAGE_KEY) ?? '';
    }
  } catch {
    // ignore storage errors
  }

  const store = writable<string>(initial);

  // persist on changes
  store.subscribe((val) => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        if (!val) sessionStorage.removeItem(STORAGE_KEY);
        else sessionStorage.setItem(STORAGE_KEY, val);
      }
    } catch {
      // ignore
    }
  });

  return store;
}

export const apiKeyStore = createSessionStorageBackedStore();

export const isSessionOnly = readable(true);
