import { Drawer } from './Drawer.js';
import timer from '../core/Timer.js';
import phaseManager from '../core/PhaseManager.js';

const SVG_ICONS = {
  completed: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="20" rx="4" fill="currentColor" fill-opacity="0.15"/>
    <path d="M6 10.5L9 13.5L14.5 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  current: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 3V6L13 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16.3 6.7A7 7 0 1 1 6.7 3.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,
  pending: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.5"/>
    <circle cx="10" cy="10" r="2.5" fill="currentColor" fill-opacity="0.2"/>
  </svg>`,
};

/**
 * PhaseList — right drawer listing every phase with status icons and
 * click-to-jump (disabled while the timer runs).
 */
export class PhaseList extends Drawer {
  constructor() {
    super({
      panel: '#phases-panel',
      toggleBtn: '#phases-btn',
      closeBtn: '#phases-close',
      backdrop: '#phases-backdrop',
      toggleAction: 'togglePhases',
    });
  }

  mount() {
    super.mount();
    this._listEl = document.querySelector('#phases-list');

    for (const ev of ['phase:changed', 'timer:start', 'timer:pause', 'timer:resume', 'timer:reset', 'debate:reset']) {
      this.listen(ev, () => this._rebuild());
    }

    this.bindDom(this._listEl, 'click', (e) => {
      const item = e.target.closest('.phase-item.clickable');
      if (!item) return;
      const idx = Number(item.dataset.index);
      if (!Number.isNaN(idx)) phaseManager.jumpToPhase(idx);
    });
  }

  /* ── private ──────────────────────────────────────────── */

  _rebuild() {
    if (!this._listEl) return;

    const idx = phaseManager.currentIndex;
    const clickable = !timer.isRunning;
    const fragment = document.createDocumentFragment();

    phaseManager.phases.forEach((phase, i) => {
      const status = i < idx ? 'completed' : i === idx ? 'current' : 'pending';

      const item = document.createElement('div');
      item.className = `phase-item ${status}${clickable ? ' clickable' : ''}`;
      item.dataset.index = i;

      const name = document.createElement('span');
      name.className = 'phase-name';
      name.textContent = phase.name; // user-provided team names: never innerHTML

      const icon = document.createElement('span');
      icon.className = 'phase-status';
      icon.innerHTML = SVG_ICONS[status];

      item.append(name, icon);
      fragment.appendChild(item);
    });

    this._listEl.replaceChildren(fragment);
  }
}
