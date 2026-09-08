import eventBus from './EventBus.js';
import timer from './Timer.js';

/**
 * PhaseManager — manages the ordered list of debate phases,
 * the current index, and coordinates with Timer for durations.
 *
 * Navigation is refused while the timer is running.
 */
export class PhaseManager {
  constructor() {
    /** @type {Array<{name: string, duration: number}>} */
    this._phases = [];
    this._currentIndex = 0;
  }

  /* ── getters ──────────────────────────────────────────── */

  get phases() {
    return this._phases;
  }

  get currentIndex() {
    return this._currentIndex;
  }

  get currentPhase() {
    return this._phases[this._currentIndex] ?? null;
  }

  get total() {
    return this._phases.length;
  }

  /* ── public API ───────────────────────────────────────── */

  /**
   * Replace the entire phase list (after format change / config apply).
   * Resets to the first phase.
   */
  setPhases(phases) {
    this._phases = phases;
    this._goTo(0);
  }

  nextPhase() {
    if (timer.isRunning) return;
    if (this._currentIndex < this._phases.length - 1) {
      this._goTo(this._currentIndex + 1);
    }
  }

  previousPhase() {
    if (timer.isRunning) return;
    if (this._currentIndex > 0) {
      this._goTo(this._currentIndex - 1);
    }
  }

  jumpToPhase(index) {
    if (timer.isRunning) return;
    if (index < 0 || index >= this._phases.length) return;
    this._goTo(index);
  }

  resetDebate() {
    timer.reset();
    eventBus.emit('debate:reset', {});
    this._goTo(0);
  }

  /* ── private helpers ──────────────────────────────────── */

  _goTo(index) {
    this._currentIndex = index;
    const phase = this.currentPhase;
    if (phase) timer.load(phase.duration);
    eventBus.emit('phase:changed', {
      index: this._currentIndex,
      phase,
      total: this._phases.length,
    });
  }
}

const phaseManager = new PhaseManager();
export default phaseManager;
