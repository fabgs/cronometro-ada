import Component from './Component.js';
import configManager from '../core/ConfigManager.js';
import formatRegistry from '../formats/FormatRegistry.js';

/** Static shortcut groups. Formats are appended from the registry. */
const SHORTCUT_GROUPS = [
  {
    column: 0,
    title: 'Cronómetro',
    items: [
      ['Espacio', 'Iniciar/Pausar/Reanudar'],
      ['R', 'Resetear fase actual'],
      ['D', 'Resetear debate completo'],
    ],
  },
  {
    column: 0,
    title: 'Navegación',
    items: [
      ['← →', 'Cambiar fase'],
      [', .', 'Ajustar tiempo (±1s)'],
      ['↑ ↓', 'Ajustar tiempo (±10s)'],
      ['+ -', 'Ajustar tiempo (±30s)'],
    ],
  },
  {
    column: 1,
    title: 'Paneles',
    items: [
      ['C', 'Configuración'],
      ['F', 'Panel de fases'],
      ['Escape', 'Cerrar paneles'],
      ['Enter', 'Aplicar configuración'],
    ],
  },
  {
    column: 1,
    title: 'Formatos',
    items: () => formatRegistry.list().filter((f) => f.shortcut).map((f) => [f.shortcut, f.label]),
  },
  {
    column: 1,
    title: 'Otros',
    items: [
      ['H', 'Mostrar/ocultar ayuda'],
      ['T', 'Alternar modo oscuro'],
    ],
  },
];

/**
 * KeyboardHelp — small fixed indicator plus a modal listing all shortcuts.
 * Both elements are created on mount and toggled with the `hidden` attribute.
 */
export class KeyboardHelp extends Component {
  mount() {
    this._indicator = this._createIndicator();
    this._panel = this._createPanel();
    document.body.append(this._indicator, this._panel);

    this.bindDom(this._indicator, 'click', () => this._togglePanel());
    this.bindDom(this._panel.querySelector('.keyboard-help-close'), 'click', () => this._hidePanel());

    this.listen('keyboard:action', ({ action }) => {
      if (action === 'toggleHelp') this._togglePanel();
      if (action === 'closePanels') this._hidePanel();
    });
    this.listen('config:applied', () => this._updateVisibility());
    this.listen('config:reset', () => this._updateVisibility());

    this._updateVisibility();
  }

  destroy() {
    super.destroy();
    this._indicator?.remove();
    this._panel?.remove();
  }

  /* ── private ──────────────────────────────────────────── */

  _updateVisibility() {
    this._indicator.hidden = !configManager.isKeyboardEnabled();
  }

  _togglePanel() {
    this._panel.hidden = !this._panel.hidden;
  }

  _hidePanel() {
    this._panel.hidden = true;
  }

  _createIndicator() {
    const el = document.createElement('div');
    el.id = 'keyboard-help-indicator';
    el.setAttribute('role', 'button');
    el.innerHTML = `
      <div class="keyboard-help-indicator-title">Controles:</div>
      <div class="keyboard-help-indicator-sub">Presiona H para ver todos</div>`;
    return el;
  }

  _createPanel() {
    const panel = document.createElement('div');
    panel.id = 'keyboard-help-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Controles de teclado');

    const columns = [0, 1].map((col) =>
      SHORTCUT_GROUPS.filter((g) => g.column === col).map(renderGroup).join(''),
    );

    panel.innerHTML = `
      <div class="keyboard-help-header">
        <h3 class="keyboard-help-title">Controles de Teclado</h3>
        <button type="button" class="keyboard-help-close" aria-label="Cerrar">×</button>
      </div>
      <div class="keyboard-help-content">
        <div class="keyboard-help-section">${columns[0]}</div>
        <div class="keyboard-help-section">${columns[1]}</div>
      </div>
      <div class="keyboard-help-footer">
        Los controles de tiempo solo funcionan cuando el cronómetro está detenido o pausado
      </div>`;
    return panel;
  }
}

function renderGroup(group) {
  const items = typeof group.items === 'function' ? group.items() : group.items;
  const rows = items
    .map(([key, desc]) => `<div class="keyboard-help-item"><span class="keyboard-help-key">${key}:</span> ${desc}</div>`)
    .join('');
  return `<h4>${group.title}</h4>${rows}`;
}
