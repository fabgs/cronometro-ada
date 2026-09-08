import { Drawer } from './Drawer.js';
import configManager from '../core/ConfigManager.js';
import { fieldInputId, fieldPath, getPath, setPath } from '../core/configSchema.js';

const CHEVRON = `<svg class="chevron" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const attr = (name, value) => (value === undefined || value === null ? '' : ` ${name}="${escapeHtml(value)}"`);

/**
 * ConfigPanel — left drawer with the configuration form.
 *
 * The form is generated from `configManager.sections()`: one collapsible
 * section per registered format plus the common sections. Nothing here knows
 * about specific formats, so adding a format never touches this file.
 */
export class ConfigPanel extends Drawer {
  constructor() {
    super({
      panel: '#config-panel',
      toggleBtn: '#config-btn',
      closeBtn: '#config-close',
      backdrop: '#config-backdrop',
      toggleAction: 'toggleConfig',
    });
  }

  mount() {
    super.mount();
    this._sectionsEl = this.panel.querySelector('#config-sections');
    this._applyBtn = this.panel.querySelector('#apply-config-btn');
    this._resetBtn = this.panel.querySelector('#reset-defaults-btn');

    this._sectionsEl.innerHTML = configManager.sections().map(renderSection).join('');
    this._populate();

    this.bindDom(this._applyBtn, 'click', () => this._apply());
    this.bindDom(this._resetBtn, 'click', () => configManager.reset());

    // Stepper buttons (event delegation)
    this.bindDom(this._sectionsEl, 'click', (e) => {
      const btn = e.target.closest('.stepper-btn');
      if (btn) this._step(btn);
    });

    // Conditional fields follow their controlling checkbox
    this.bindDom(this._sectionsEl, 'change', (e) => {
      if (e.target.matches('input[type="checkbox"]')) this._updateConditionals();
    });

    this.listen('format:changed', ({ format }) => this._expandFormat(format));
    this.listen('config:applied', () => this._populate());
    this.listen('config:reset', () => this._populate());
    this.listen('keyboard:action', ({ action }) => {
      if (action === 'applyConfig' && this.isOpen) this._apply();
    });
  }

  /** Unsaved edits survive close/reopen (as in the original UI); only the
   *  <details> state is re-synced. Inputs are refreshed on config:applied /
   *  config:reset, which are the only moments the saved config changes. */
  onOpen() {
    this._syncDetailsState();
  }

  /* ── private ──────────────────────────────────────────── */

  _inputs() {
    return [...this._sectionsEl.querySelectorAll('[data-path]')];
  }

  /** Fill every input from the current config. */
  _populate() {
    const cfg = configManager.getAll();
    for (const input of this._inputs()) {
      const value = getPath(cfg, input.dataset.path);
      if (input.type === 'checkbox') input.checked = Boolean(value);
      else input.value = value ?? '';
    }
    this._updateConditionals();
  }

  /** Read every input into a partial config object (raw values). */
  _readFields() {
    const partial = { currentFormat: configManager.getCurrentFormat() };
    for (const input of this._inputs()) {
      const value = input.type === 'checkbox' ? input.checked : input.value;
      setPath(partial, input.dataset.path, value);
    }
    return partial;
  }

  _apply() {
    configManager.apply(this._readFields());
    this._flashApplied();
    this.close();
  }

  _flashApplied() {
    const btn = this._applyBtn;
    const orig = btn.textContent;
    btn.textContent = '✓ Guardado';
    btn.classList.add('btn-success');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('btn-success');
    }, 1500);
  }

  _step(btn) {
    const input = this._sectionsEl.querySelector(`#${btn.dataset.target}`);
    if (!input) return;
    const step = parseInt(btn.dataset.step, 10) || 1;
    const min = input.min === '' ? -Infinity : Number(input.min);
    const max = input.max === '' ? Infinity : Number(input.max);
    const current = parseInt(input.value, 10) || 0;
    const next = btn.classList.contains('stepper-plus') ? current + step : current - step;
    input.value = Math.max(min, Math.min(max, next));
  }

  _updateConditionals() {
    for (const el of this._sectionsEl.querySelectorAll('[data-show-when]')) {
      const controller = this._sectionsEl.querySelector(`#${el.dataset.showWhen}`);
      el.hidden = controller ? !controller.checked : false;
    }
  }

  _formatSections() {
    return [...this._sectionsEl.querySelectorAll('details[data-format]')];
  }

  /** Expand the section of the given format (others untouched). */
  _expandFormat(formatId) {
    for (const el of this._formatSections()) {
      if (el.dataset.format === formatId) el.open = true;
    }
  }

  /** Only the active format expanded; every other section collapsed. */
  _syncDetailsState() {
    const current = configManager.getCurrentFormat();
    for (const el of this._sectionsEl.querySelectorAll('details.config-section')) {
      el.open = el.dataset.format === current;
    }
  }
}

/* ── markup generation (pure) ─────────────────────────── */

function renderSection(section) {
  return `
    <details class="config-section" id="${escapeHtml(section.id)}"${attr('data-format', section.formatId)}>
      <summary class="section-header">
        <span>${escapeHtml(section.label)}</span>
        ${CHEVRON}
      </summary>
      <div class="section-body">
        ${section.fields.map(renderField).join('')}
      </div>
    </details>`;
}

function renderField(field) {
  const id = fieldInputId(field);
  const path = fieldPath(field);
  const showWhen = field.showWhen ? fieldInputId({ group: field.group, key: field.showWhen }) : null;
  const conditional = showWhen ? ` field-conditional" data-show-when="${showWhen}` : '';
  const hint = field.hint ? `<p class="field-hint">${escapeHtml(field.hint)}</p>` : '';

  switch (field.type) {
    case 'checkbox':
      return `
        <label class="toggle-switch">
          <input type="checkbox" id="${id}" data-path="${path}" />
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
          <span class="toggle-label">${escapeHtml(field.label)}</span>
        </label>${hint}`;

    case 'number': {
      const step = field.step ?? 1;
      return `
        <div class="field-group${conditional}">
          <label for="${id}">${escapeHtml(field.label)}</label>
          <div class="stepper">
            <button type="button" class="stepper-btn stepper-minus" data-target="${id}" data-step="${step}" aria-label="Restar ${step}">−</button>
            <input type="number" id="${id}" data-path="${path}"${attr('min', field.min)}${attr('max', field.max)} step="${step}" />
            <button type="button" class="stepper-btn stepper-plus" data-target="${id}" data-step="${step}" aria-label="Sumar ${step}">+</button>
          </div>
          ${hint}
        </div>`;
    }

    default:
      return `
        <div class="field-group${conditional}">
          <label for="${id}">${escapeHtml(field.label)}</label>
          <input type="text" id="${id}" data-path="${path}"${attr('placeholder', field.placeholder)} />
          ${hint}
        </div>`;
  }
}
