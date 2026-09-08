import Component from './Component.js';
import configManager from '../core/ConfigManager.js';
import formatRegistry from '../formats/FormatRegistry.js';

/**
 * FormatSelector — one button per registered format, rendered from the
 * FormatRegistry. Selecting a format persists it through ConfigManager.
 */
export class FormatSelector extends Component {
  mount() {
    this.container = document.querySelector('.format-selector-panel');
    if (!this.container) return;

    this.container.innerHTML = formatRegistry
      .list()
      .map((f) => {
        const title = f.shortcut ? ` title="Tecla ${f.shortcut}"` : '';
        return `<button type="button" class="format-btn" data-format="${f.id}"${title}>${f.label}</button>`;
      })
      .join('');

    this.bindDom(this.container, 'click', (e) => {
      const btn = e.target.closest('.format-btn');
      if (btn) configManager.setCurrentFormat(btn.dataset.format);
    });

    this.listen('keyboard:action', ({ action, format }) => {
      if (action === 'selectFormat') configManager.setCurrentFormat(format);
    });

    this.listen('format:changed', () => this._updateActive());
    this.listen('config:reset', () => this._updateActive());
    this.listen('config:applied', () => this._updateActive());

    this._updateActive();
  }

  _updateActive() {
    const current = configManager.getCurrentFormat();
    this.container.querySelectorAll('.format-btn').forEach((btn) => {
      const active = btn.dataset.format === current;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }
}
