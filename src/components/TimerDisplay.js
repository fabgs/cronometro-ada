import Component from './Component.js';
import timer from '../core/Timer.js';
import phaseManager from '../core/PhaseManager.js';
import { APP_TITLE } from '../core/defaults.js';
import { formatTime, getWarningLevel } from '../core/time.js';

const IDLE_SPEAKER = 'Listo para comenzar';

/**
 * TimerDisplay — shows the countdown MM:SS, the current speaker, applies
 * warning / danger colours and mirrors the time in the page title.
 */
export class TimerDisplay extends Component {
  constructor() {
    super();
    this._lastCssClass = '';
    this._lastTitle = '';
    this._lastText = '';
  }

  mount() {
    this._timerEl = document.querySelector('#timer');
    this._speakerEl = document.querySelector('#current-speaker');

    this.listen('timer:tick', (d) => this._onTick(d));
    this.listen('timer:reset', () => this._setTitle(APP_TITLE));
    this.listen('phase:changed', () => this._updateSpeaker());
    this.listen('debate:reset', () => this._updateSpeaker());

    this.bindDom(window, 'resize', () => this._adjustSize());
  }

  /* ── private ──────────────────────────────────────────── */

  _setTitle(title) {
    if (title !== this._lastTitle) {
      this._lastTitle = title;
      document.title = title;
    }
  }

  _onTick({ currentTime, totalTime }) {
    if (!this._timerEl) return;

    const text = formatTime(currentTime);

    // Re-fit only when the sign flips (text width changes noticeably)
    const signChanged = this._lastText.startsWith('-') !== text.startsWith('-');
    if (!this._lastText || signChanged) this._adjustSize(text);

    if (text !== this._lastText) {
      this._lastText = text;
      this._timerEl.textContent = text;
    }

    const level = getWarningLevel(currentTime);
    const cssClass = level ? `timer ${level}` : 'timer';
    if (cssClass !== this._lastCssClass) {
      this._lastCssClass = cssClass;
      this._timerEl.className = cssClass;
    }

    // Page title — while running, paused, or after a seek
    if (totalTime > 0 && (timer.isRunning || timer.isPaused || currentTime !== totalTime)) {
      this._setTitle(`${text} - ${APP_TITLE}`);
    }
  }

  _updateSpeaker() {
    if (!this._speakerEl) return;
    const phase = phaseManager.currentPhase;
    this._speakerEl.textContent = phase ? phase.name : IDLE_SPEAKER;
    if (!timer.isRunning) this._setTitle(APP_TITLE);
  }

  /** Shrink the digits on narrow containers so they never overflow. */
  _adjustSize(text = this._timerEl?.textContent ?? '') {
    if (!this._timerEl) return;
    const parentEl = this._timerEl.parentElement;
    if (!parentEl) return;
    const containerWidth = parentEl.offsetWidth - 20;
    const style = this._timerEl.style;

    style.fontSize = '';
    style.whiteSpace = '';
    style.wordBreak = '';
    style.overflow = '';
    style.letterSpacing = '';

    if (containerWidth >= 600) return;

    const hasNeg = text.includes('-');
    const factor = hasNeg ? 1.8 : 2.2;
    const base = Math.min((containerWidth / Math.max(text.length, 1)) * factor, containerWidth * 0.22);
    const min = Math.max(base * 0.5, 28);
    const max = Math.min(base, hasNeg ? 100 : 120);

    style.fontSize = `${Math.max(min, Math.min(max, base))}px`;
    style.whiteSpace = 'normal';
    style.wordBreak = 'break-all';
    style.overflow = 'visible';
    style.letterSpacing = hasNeg ? '0.01em' : '0.02em';
    style.lineHeight = '1';
    style.textAlign = 'center';
  }
}
