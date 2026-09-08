import eventBus from '../core/EventBus.js';
import configManager from '../core/ConfigManager.js';
import formatRegistry from '../formats/FormatRegistry.js';

/**
 * Static key → action table. Letter keys are matched case-insensitively.
 * Format shortcuts are not listed here: they come from the FormatRegistry.
 */
export const KEY_ACTIONS = {
  ' ': { action: 'toggleStartPause' },
  ArrowLeft: { action: 'previousPhase' },
  ArrowRight: { action: 'nextPhase' },
  r: { action: 'resetPhase' },
  d: { action: 'resetDebate' },
  c: { action: 'toggleConfig' },
  f: { action: 'togglePhases' },
  h: { action: 'toggleHelp' },
  t: { action: 'toggleDarkMode' },
  ArrowUp: { action: 'adjustTime', delta: 10 },
  ArrowDown: { action: 'adjustTime', delta: -10 },
  '+': { action: 'adjustTime', delta: 30 },
  '=': { action: 'adjustTime', delta: 30 },
  '-': { action: 'adjustTime', delta: -30 },
  ',': { action: 'adjustTime', delta: 1 },
  '.': { action: 'adjustTime', delta: -1 },
  Enter: { action: 'applyConfig' },
  Escape: { action: 'closePanels' },
};

/**
 * KeyboardService — centralised keyboard shortcut handler.
 *
 * Emits `keyboard:action` with `{ action, ...payload, key }` for each
 * recognised shortcut. Guards: input focus, modifier keys, and the global
 * enable flag from ConfigManager.
 */
export class KeyboardService {
  constructor() {
    this._isInputFocused = false;
    this._boundKeydown = this._onKeydown.bind(this);
    this._boundFocusIn = this._onFocusIn.bind(this);
    this._boundFocusOut = this._onFocusOut.bind(this);
  }

  init() {
    document.addEventListener('focusin', this._boundFocusIn);
    document.addEventListener('focusout', this._boundFocusOut);
    document.addEventListener('keydown', this._boundKeydown);
  }

  destroy() {
    document.removeEventListener('focusin', this._boundFocusIn);
    document.removeEventListener('focusout', this._boundFocusOut);
    document.removeEventListener('keydown', this._boundKeydown);
  }

  /**
   * Resolve a key to an action payload, or null.
   * @param {string} key - KeyboardEvent.key
   */
  resolve(key) {
    const direct = KEY_ACTIONS[key] ?? KEY_ACTIONS[key.toLowerCase()];
    if (direct) return direct;
    const fmt = formatRegistry.byShortcut(key);
    if (fmt) return { action: 'selectFormat', format: fmt.id };
    return null;
  }

  /* ── private ──────────────────────────────────────────── */

  _isEditable(el) {
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  }

  _onFocusIn(e) {
    if (this._isEditable(e.target)) this._isInputFocused = true;
  }

  _onFocusOut(e) {
    if (this._isEditable(e.target)) this._isInputFocused = false;
  }

  _onKeydown(e) {
    if (!configManager.isKeyboardEnabled()) return;
    if (this._isInputFocused || e.ctrlKey || e.altKey || e.metaKey) return;

    const payload = this.resolve(e.key);
    if (!payload) return;

    e.preventDefault();
    eventBus.emit('keyboard:action', { ...payload, key: e.key });
  }
}

const keyboardService = new KeyboardService();
export default keyboardService;
