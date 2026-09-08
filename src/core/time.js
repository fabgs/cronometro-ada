import { TIMER_THRESHOLDS } from './defaults.js';

/**
 * Pure helpers shared by the timer engine and the UI components.
 * Single source of truth for time formatting and warning thresholds.
 */

/**
 * Format seconds as MM:SS, with a leading "-" for overtime.
 * @param {number} seconds
 * @returns {string}
 */
export function formatTime(seconds) {
  const abs = Math.abs(seconds);
  const mins = Math.floor(abs / 60);
  const secs = abs % 60;
  const sign = seconds < 0 ? '-' : '';
  return `${sign}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Map remaining seconds to a visual warning level.
 * @param {number} seconds
 * @returns {'warning'|'danger'|null}
 */
export function getWarningLevel(seconds) {
  if (seconds <= TIMER_THRESHOLDS.dangerStart) return 'danger';
  if (seconds <= TIMER_THRESHOLDS.warningStart && seconds >= TIMER_THRESHOLDS.warningEnd) {
    return 'warning';
  }
  return null;
}

/**
 * Parse an integer from user input, falling back when invalid and clamping
 * to the optional [min, max] range.
 * @param {*} value
 * @param {number} fallback
 * @param {{min?: number, max?: number}} [range]
 * @returns {number}
 */
export function toInt(value, fallback, { min, max } = {}) {
  let n = typeof value === 'number' ? value : parseInt(value, 10);
  if (!Number.isFinite(n)) n = fallback;
  if (min !== undefined && n < min) n = min;
  if (max !== undefined && n > max) n = max;
  return n;
}
