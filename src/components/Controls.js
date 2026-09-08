import Component from './Component.js';
import timer from '../core/Timer.js';
import phaseManager from '../core/PhaseManager.js';

/**
 * Controls — Start/Pause, Reset Phase, Reset Debate, and navigation buttons.
 */
export class Controls extends Component {
  mount() {
    this._sp = document.querySelector('#start-pause-btn');
    this._reset = document.querySelector('#reset-btn');
    this._resetDebate = document.querySelector('#reset-debate-btn');
    this._prev = document.querySelector('#prev-btn');
    this._next = document.querySelector('#next-btn');

    this.bindDom(this._sp, 'click', () => this._toggleStartPause());
    this.bindDom(this._reset, 'click', () => this._resetPhase());
    this.bindDom(this._resetDebate, 'click', () => phaseManager.resetDebate());
    this.bindDom(this._prev, 'click', () => phaseManager.previousPhase());
    this.bindDom(this._next, 'click', () => phaseManager.nextPhase());

    for (const ev of ['timer:start', 'timer:pause', 'timer:resume', 'timer:reset', 'phase:changed', 'debate:reset']) {
      this.listen(ev, () => this._updateButtons());
    }

    this.listen('keyboard:action', (payload) => this._onKeyboardAction(payload));
    this._updateButtons();
  }

  /* ── private ──────────────────────────────────────────── */

  _onKeyboardAction({ action, delta }) {
    switch (action) {
      case 'toggleStartPause':
        this._toggleStartPause();
        break;
      case 'previousPhase':
        phaseManager.previousPhase();
        break;
      case 'nextPhase':
        phaseManager.nextPhase();
        break;
      case 'resetPhase':
        this._resetPhase();
        break;
      case 'resetDebate':
        if (!timer.isRunning) phaseManager.resetDebate();
        break;
      case 'adjustTime':
        if (!timer.isRunning) {
          timer.adjustTime(delta);
          this._showFeedback(`${delta > 0 ? '+' : ''}${delta}s`);
        }
        break;
      default:
        break;
    }
  }

  _toggleStartPause() {
    if (!timer.isRunning && !timer.isPaused) timer.start();
    else timer.pause();
    this._updateButtons();
  }

  _resetPhase() {
    if (timer.isRunning) return;
    timer.reset();
    this._updateButtons();
  }

  _updateButtons() {
    this._sp.className = 'control-btn';
    if (timer.isRunning) {
      this._sp.textContent = 'Pausar';
      this._sp.classList.add('pause');
    } else if (timer.isPaused) {
      this._sp.textContent = 'Reanudar';
      this._sp.classList.add('pause');
    } else {
      this._sp.textContent = 'Iniciar';
      this._sp.classList.add('start');
    }

    // Disable nav / reset while running
    this._prev.disabled = timer.isRunning || phaseManager.currentIndex === 0;
    this._next.disabled = timer.isRunning || phaseManager.currentIndex >= phaseManager.total - 1;
    this._reset.disabled = timer.isRunning;
    this._resetDebate.disabled = timer.isRunning;
  }

  _showFeedback(message) {
    if (!this._feedbackEl) {
      this._feedbackEl = document.createElement('div');
      this._feedbackEl.className = 'keyboard-feedback';
      this._feedbackEl.setAttribute('role', 'status');
      document.body.appendChild(this._feedbackEl);
    }
    this._feedbackEl.textContent = message;
    this._feedbackEl.classList.add('visible');
    clearTimeout(this._feedbackTimeout);
    this._feedbackTimeout = setTimeout(() => this._feedbackEl.classList.remove('visible'), 1000);
  }

  destroy() {
    super.destroy();
    clearTimeout(this._feedbackTimeout);
    this._feedbackEl?.remove();
  }
}
