import eventBus from './EventBus.js';
import { MIN_NEGATIVE_TIME } from './defaults.js';

/**
 * How often the wall clock is sampled while running. The displayed second
 * only changes when the integer value changes, so sampling several times per
 * second means a delayed callback (busy main thread, GC pause) still catches
 * every second instead of jumping e.g. from 40 to 38.
 */
export const SAMPLE_INTERVAL_MS = 200;

/**
 * Timer — core countdown engine with wall-clock sync.
 * Does NOT touch the DOM; communicates exclusively via EventBus.
 *
 * Events: timer:tick {currentTime, totalTime, isRunning, isPaused},
 *         timer:start, timer:pause, timer:resume, timer:reset.
 * `timer:tick` is emitted once per second change (plus on load/reset/seek).
 * Warning levels are derived by consumers from `currentTime`
 * (see core/time.js → getWarningLevel).
 */
export class Timer {
  constructor() {
    this._currentTime = 0;
    this._totalTime = 0;
    this._isRunning = false;
    this._isPaused = false;
    this._interval = null;
    this._startTimestamp = null;
    // Re-sample immediately when the tab becomes visible again: browsers
    // throttle timers in background tabs, so the first visible frame would
    // otherwise show a stale value for up to one sample interval.
    this._onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && this._isRunning) this._sample();
    };
  }

  /* ── getters ──────────────────────────────────────────── */

  get currentTime() {
    return this._currentTime;
  }

  get totalTime() {
    return this._totalTime;
  }

  get isRunning() {
    return this._isRunning;
  }

  get isPaused() {
    return this._isPaused;
  }

  /* ── public API ───────────────────────────────────────── */

  /**
   * Load a new duration (when switching phases). Resets all timer state.
   */
  load(duration) {
    this._stop();
    this._currentTime = duration;
    this._totalTime = duration;
    eventBus.emit('timer:tick', this._tickData());
  }

  start() {
    if (this._isRunning) return;

    this._isRunning = true;
    this._isPaused = false;

    if (this._currentTime === 0 && this._totalTime > 0) {
      this._currentTime = this._totalTime;
    }

    this._syncOrigin();
    this._startSampling();
    eventBus.emit('timer:start', {});
  }

  /** Toggles between running and paused. */
  pause() {
    if (this._isRunning && !this._isPaused) {
      this._isPaused = true;
      this._isRunning = false;
      this._stopSampling();
      eventBus.emit('timer:pause', {});
    } else if (this._isPaused) {
      this._isPaused = false;
      this._isRunning = true;
      this._syncOrigin();
      this._startSampling();
      eventBus.emit('timer:resume', {});
    }
  }

  reset() {
    this._stop();
    this._currentTime = this._totalTime;
    eventBus.emit('timer:reset', {});
    eventBus.emit('timer:tick', this._tickData());
  }

  /**
   * Seek to an absolute time (progress-bar click / drag).
   */
  seekTo(time) {
    this._currentTime = time;
    if (this._isRunning) this._syncOrigin();
    eventBus.emit('timer:tick', this._tickData());
  }

  /**
   * Adjust by ±N seconds (keyboard shortcut). Only allowed when NOT running.
   */
  adjustTime(delta) {
    if (this._isRunning) return;

    const newTime = this._currentTime + delta;
    this._currentTime = Math.max(MIN_NEGATIVE_TIME, Math.min(this._totalTime, newTime));
    eventBus.emit('timer:tick', this._tickData());
  }

  /* ── private helpers ──────────────────────────────────── */

  /** Recompute the wall-clock origin so elapsed time matches currentTime. */
  _syncOrigin() {
    const elapsed = this._totalTime - this._currentTime;
    this._startTimestamp = Date.now() - elapsed * 1000;
  }

  /** Read the wall clock; emit a tick only if the displayed second changed. */
  _sample() {
    const realElapsed = Math.floor((Date.now() - this._startTimestamp) / 1000);
    const next = this._totalTime - realElapsed;
    if (next === this._currentTime) return;
    this._currentTime = next;
    eventBus.emit('timer:tick', this._tickData());
  }

  _startSampling() {
    this._stopSampling();
    this._interval = setInterval(() => this._sample(), SAMPLE_INTERVAL_MS);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this._onVisibilityChange);
    }
  }

  _stopSampling() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this._onVisibilityChange);
    }
  }

  _stop() {
    this._stopSampling();
    this._isRunning = false;
    this._isPaused = false;
    this._startTimestamp = null;
  }

  _tickData() {
    return {
      currentTime: this._currentTime,
      totalTime: this._totalTime,
      isRunning: this._isRunning,
      isPaused: this._isPaused,
    };
  }
}

const timer = new Timer();
export default timer;
