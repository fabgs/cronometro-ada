/**
 * Application-wide defaults and constants.
 * All durations are in seconds.
 *
 * Format-specific defaults live inside each format module (see src/formats/).
 */

/** Title shown in the browser tab when the timer is idle. */
export const APP_TITLE = 'Cronómetro de Debate';

/** Default format id (must match a registered format). */
export const DEFAULT_FORMAT = 'academico';

/**
 * Defaults for the phases shared by every format (appended after the
 * format-specific speeches). The shape mirrors what is persisted.
 */
export const COMMON_DEFAULTS = {
  deliberacion: { time: 600, description: 'Deliberación de jueces' },
  feedback: { time: 900, description: 'Feedback' },
};

/**
 * Whether keyboard controls are enabled by default.
 * On mobile (≤768 px) they start disabled; on desktop, enabled.
 */
export function defaultKeyboardEnabled() {
  if (typeof window === 'undefined') return true;
  return window.innerWidth > 768;
}

/** Timer thresholds (seconds) for warning / danger colours. */
export const TIMER_THRESHOLDS = {
  warningStart: 10,   // ≤ 10 s → warning (yellow)
  warningEnd: -10,    // ≥ -10 s → still warning
  dangerStart: -11,   // ≤ -11 s → danger (red)
};

/** Minimum negative time allowed when adjusting via keyboard. */
export const MIN_NEGATIVE_TIME = -300;

/** localStorage keys */
export const STORAGE_KEYS = {
  config: 'ada-debate-config',
  theme: 'debate-timer-theme',
};
