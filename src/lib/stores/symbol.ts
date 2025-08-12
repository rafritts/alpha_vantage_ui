import { writable } from 'svelte/store';

// Global symbol store shared across routes
// Defaults to AAPL
export const symbolStore = writable<string>('AAPL');
