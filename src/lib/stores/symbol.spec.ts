import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { symbolStore } from './symbol';

describe('symbolStore', () => {
  it('has default value AAPL', () => {
    expect(get(symbolStore)).toBe('AAPL');
  });

  it('updates value when set', () => {
    symbolStore.set('MSFT');
    expect(get(symbolStore)).toBe('MSFT');
  });
});
