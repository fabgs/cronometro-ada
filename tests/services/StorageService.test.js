import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../../src/services/StorageService.js';

describe('StorageService', () => {
  const s = new StorageService();
  beforeEach(() => localStorage.clear());

  it('round-trips JSON values', () => {
    s.set('k', { a: [1, 2] });
    expect(s.get('k')).toEqual({ a: [1, 2] });
  });

  it('returns null for missing keys', () => {
    expect(s.get('missing')).toBeNull();
  });

  it('returns legacy plain strings as-is', () => {
    localStorage.setItem('theme', 'dark');
    expect(s.get('theme')).toBe('dark');
  });

  it('removes keys', () => {
    s.set('k', 1);
    s.remove('k');
    expect(s.get('k')).toBeNull();
  });
});
