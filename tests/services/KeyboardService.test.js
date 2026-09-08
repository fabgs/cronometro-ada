import { describe, it, expect } from 'vitest';
import { KeyboardService } from '../../src/services/KeyboardService.js';

describe('KeyboardService.resolve', () => {
  const ks = new KeyboardService();

  it('maps static keys case-insensitively', () => {
    expect(ks.resolve(' ')).toEqual({ action: 'toggleStartPause' });
    expect(ks.resolve('r')).toEqual({ action: 'resetPhase' });
    expect(ks.resolve('R')).toEqual({ action: 'resetPhase' });
    expect(ks.resolve('ArrowUp')).toEqual({ action: 'adjustTime', delta: 10 });
    expect(ks.resolve('=')).toEqual({ action: 'adjustTime', delta: 30 });
  });

  it('maps format shortcuts from the registry', () => {
    expect(ks.resolve('1')).toEqual({ action: 'selectFormat', format: 'academico' });
    expect(ks.resolve('2')).toEqual({ action: 'selectFormat', format: 'bp' });
  });

  it('returns null for unmapped keys', () => {
    expect(ks.resolve('z')).toBeNull();
    expect(ks.resolve('9')).toBeNull();
  });
});
