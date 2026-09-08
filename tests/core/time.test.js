import { describe, it, expect } from 'vitest';
import { formatTime, getWarningLevel, toInt } from '../../src/core/time.js';

describe('formatTime', () => {
  it('formats positive seconds as MM:SS', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(600)).toBe('10:00');
  });

  it('prefixes overtime with a minus sign', () => {
    expect(formatTime(-1)).toBe('-00:01');
    expect(formatTime(-125)).toBe('-02:05');
  });
});

describe('getWarningLevel', () => {
  it('is null well above the threshold', () => {
    expect(getWarningLevel(60)).toBeNull();
    expect(getWarningLevel(11)).toBeNull();
  });

  it('is warning between 10 and -10 seconds inclusive', () => {
    expect(getWarningLevel(10)).toBe('warning');
    expect(getWarningLevel(0)).toBe('warning');
    expect(getWarningLevel(-10)).toBe('warning');
  });

  it('is danger from -11 seconds on', () => {
    expect(getWarningLevel(-11)).toBe('danger');
    expect(getWarningLevel(-300)).toBe('danger');
  });
});

describe('toInt', () => {
  it('parses numeric strings', () => {
    expect(toInt('240', 0)).toBe(240);
    expect(toInt(240, 0)).toBe(240);
  });

  it('falls back on invalid input', () => {
    expect(toInt('', 90)).toBe(90);
    expect(toInt('abc', 90)).toBe(90);
    expect(toInt(undefined, 90)).toBe(90);
    expect(toInt(NaN, 90)).toBe(90);
  });

  it('clamps to the range', () => {
    expect(toInt('-5', 0, { min: 0 })).toBe(0);
    expect(toInt('50', 3, { min: 1, max: 10 })).toBe(10);
  });
});
