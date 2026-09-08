import Component from './Component.js';
import timer from '../core/Timer.js';
import phaseManager from '../core/PhaseManager.js';
import { formatTime, getWarningLevel } from '../core/time.js';

/**
 * ProgressBar — interactive seek bar with click, drag, and touch support.
 */
export class ProgressBar extends Component {
  constructor() {
    super();
    this._isDragging = false;
    this._lastCssClass = '';
    this._cachedRect = null;
    this._tooltip = null;
  }

  mount() {
    this._barEl = document.querySelector('.progress-bar');
    this._fillEl = document.querySelector('#progress-fill');
    if (!this._barEl || !this._fillEl) return;

    this.listen('timer:tick', (d) => this._render(d.currentTime, d.totalTime));

    // Mouse
    this.bindDom(this._barEl, 'mousedown', (e) => this._beginDrag(e));
    this.bindDom(this._barEl, 'mousemove', (e) => {
      if (!this._isDragging) this._showTooltip(e);
    });
    this.bindDom(this._barEl, 'mouseleave', () => this._hideTooltip());
    this.bindDom(this._barEl, 'click', (e) => {
      if (!this._isDragging) this._seekFrom(e);
    });
    this.bindDom(document, 'mousemove', (e) => {
      if (this._isDragging) {
        this._seekFrom(e);
        this._showTooltip(e);
      }
    });
    this.bindDom(document, 'mouseup', () => this._endDrag());

    // Touch
    this.bindDom(this._barEl, 'touchstart', (e) => this._beginDrag(e.touches[0], e), { passive: false });
    this.bindDom(this._barEl, 'touchmove', (e) => {
      if (this._isDragging) {
        this._seekFrom(e.touches[0]);
        e.preventDefault();
      }
    }, { passive: false });
    this.bindDom(document, 'touchend', () => this._endDrag());
  }

  destroy() {
    super.destroy();
    this._tooltip?.remove();
    this._tooltip = null;
  }

  /* ── rendering ─────────────────────────────────────────── */

  _render(currentTime, totalTime) {
    if (totalTime === 0) return;
    const pct = Math.max(0, ((totalTime - currentTime) / totalTime) * 100);
    this._fillEl.style.width = `${pct}%`;

    const level = getWarningLevel(currentTime);
    const cssClass = level ? `progress-fill ${level}` : 'progress-fill';
    if (cssClass !== this._lastCssClass) {
      this._lastCssClass = cssClass;
      this._fillEl.className = cssClass;
    }
  }

  /* ── drag / seek ───────────────────────────────────────── */

  _beginDrag(point, originalEvent = point) {
    if (phaseManager.total === 0) return;
    this._isDragging = true;
    this._cachedRect = this._barEl.getBoundingClientRect();
    this._fillEl.style.transition = 'none';
    this._seekFrom(point);
    if (point.clientX !== undefined && originalEvent === point) this._showTooltip(point);
    originalEvent.preventDefault();
  }

  _endDrag() {
    if (!this._isDragging) return;
    this._isDragging = false;
    this._cachedRect = null;
    this._fillEl.style.transition = '';
    this._hideTooltip();
    this._render(timer.currentTime, timer.totalTime);
  }

  /** Convert a pointer position to a time and seek the timer there. */
  _seekFrom(point) {
    const time = this._timeAt(point);
    if (time === null) return;
    timer.seekTo(time);
  }

  /** Time (seconds) corresponding to a pointer position, or null. */
  _timeAt(point) {
    const phase = phaseManager.currentPhase;
    if (!phase) return null;
    const rect = this._cachedRect ?? this._barEl.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (point.clientX - rect.left) / rect.width));
    return Math.round(phase.duration - pct * phase.duration);
  }

  /* ── tooltip ───────────────────────────────────────────── */

  _showTooltip(point) {
    const time = this._timeAt(point);
    if (time === null) return;

    if (!this._tooltip) {
      this._tooltip = document.createElement('div');
      this._tooltip.className = 'progress-tooltip';
      document.body.appendChild(this._tooltip);
    }

    const rect = this._barEl.getBoundingClientRect();
    const x = Math.max(rect.left, Math.min(rect.right, point.clientX));
    this._tooltip.textContent = formatTime(time);
    this._tooltip.style.left = `${x}px`;
    this._tooltip.style.top = `${rect.top - 30}px`;
    this._tooltip.classList.add('visible');
  }

  _hideTooltip() {
    this._tooltip?.classList.remove('visible');
  }
}
