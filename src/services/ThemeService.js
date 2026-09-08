import eventBus from '../core/EventBus.js';
import storageService from './StorageService.js';
import { STORAGE_KEYS } from '../core/defaults.js';

const THEMES = ['light', 'dark'];

/**
 * ThemeService — manages dark/light theme toggling and persistence.
 *
 * Precedence: explicit user choice (persisted) → OS preference → light.
 */
export class ThemeService {
  constructor() {
    this._theme = 'light';
    this._media = null;
    this._onMediaChange = (e) => {
      // Only follow the OS while the user has not chosen explicitly.
      if (!this._savedTheme()) this.setTheme(e.matches ? 'dark' : 'light');
    };
  }

  init() {
    this._media = window.matchMedia('(prefers-color-scheme: dark)');
    const saved = this._savedTheme();
    if (saved) {
      this.setTheme(saved);
    } else {
      this.setTheme(this._media.matches ? 'dark' : 'light');
    }
    this._media.addEventListener('change', this._onMediaChange);
  }

  destroy() {
    if (this._media) this._media.removeEventListener('change', this._onMediaChange);
  }

  get current() {
    return this._theme;
  }

  toggle() {
    const next = this._theme === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    storageService.set(STORAGE_KEYS.theme, next);
  }

  setTheme(theme) {
    this._theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    eventBus.emit('theme:changed', { theme });
  }

  /* ── private ──────────────────────────────────────────── */

  _savedTheme() {
    const value = storageService.get(STORAGE_KEYS.theme);
    return THEMES.includes(value) ? value : null;
  }
}

const themeService = new ThemeService();
export default themeService;
