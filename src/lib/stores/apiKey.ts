import { readable, writable, type Writable, derived } from 'svelte/store';
import { sanitizeInput } from '$lib/utils/sanitize';
import { encrypt, decrypt } from '$lib/utils/encryption';

const SESSION_STORAGE_KEY = 'av_api_key';
const LOCAL_STORAGE_KEY = 'av_api_key_persistent';

// Store to track if the user has opted for persistent storage
export const persistentStorage = writable<boolean>(false);

function createStorageBackedStore(): Writable<string> {
	let initial = '';
	let isPersistent = false;

	try {
		// Check localStorage first (if it exists, user previously opted for persistence)
		if (typeof localStorage !== 'undefined') {
			const encryptedKey = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (encryptedKey) {
				initial = decrypt(encryptedKey);
				isPersistent = true;
			}
		}

		// If not found in localStorage, check sessionStorage
		if (!initial && typeof sessionStorage !== 'undefined') {
			initial = sessionStorage.getItem(SESSION_STORAGE_KEY) ?? '';
		}
	} catch {
		// ignore storage errors
	}

	// Set the initial persistent storage value
	persistentStorage.set(isPersistent);

	const store = writable<string>(initial);

	// Subscribe to both the API key and persistence preference
	const unsubscribe = derived([store, persistentStorage], ([$store, $persistentStorage]) => {
		return { value: $store, persistent: $persistentStorage };
	}).subscribe(({ value, persistent }) => {
		try {
			const sanitizedValue = sanitizeInput(value);

			// Clear both storages if no value
			if (!value) {
				if (typeof sessionStorage !== 'undefined') {
					sessionStorage.removeItem(SESSION_STORAGE_KEY);
				}
				if (typeof localStorage !== 'undefined') {
					localStorage.removeItem(LOCAL_STORAGE_KEY);
				}
				return;
			}

			// Store in appropriate storage based on user preference
			if (persistent) {
				if (typeof localStorage !== 'undefined') {
					// Encrypt before storing in localStorage
					localStorage.setItem(LOCAL_STORAGE_KEY, encrypt(sanitizedValue));
					// Also remove from sessionStorage to avoid confusion
					if (typeof sessionStorage !== 'undefined') {
						sessionStorage.removeItem(SESSION_STORAGE_KEY);
					}
				}
			} else {
				if (typeof sessionStorage !== 'undefined') {
					sessionStorage.setItem(SESSION_STORAGE_KEY, sanitizedValue);
					// Remove from localStorage if it exists
					if (typeof localStorage !== 'undefined') {
						localStorage.removeItem(LOCAL_STORAGE_KEY);
					}
				}
			}
		} catch {
			// ignore storage errors
		}
	});

	return store;
}

export const apiKeyStore = createStorageBackedStore();

// Derived store that indicates if the API key is session-only
export const isSessionOnly = derived(
	persistentStorage,
	($persistentStorage) => !$persistentStorage
);
