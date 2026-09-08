import eventBus from './EventBus.js';
import storageService from '../services/StorageService.js';
import formatRegistry from '../formats/FormatRegistry.js';
import {
  COMMON_SECTIONS,
  coerceFieldValue,
  fieldPath,
  formatSection,
  getPath,
  setPath,
} from './configSchema.js';
import {
  COMMON_DEFAULTS,
  DEFAULT_FORMAT,
  STORAGE_KEYS,
  defaultKeyboardEnabled,
} from './defaults.js';

/**
 * ConfigManager — reads, validates and persists the debate configuration.
 *
 * The config shape is derived from the FormatRegistry and the common schema:
 *
 *   {
 *     currentFormat: 'academico',
 *     keyboardControlsEnabled: true,
 *     deliberacion: { time, description },
 *     feedback: { time, description },
 *     <formatId>: { ...format.defaults },   // one entry per registered format
 *   }
 *
 * It mirrors what is persisted in localStorage under `ada-debate-config`, so
 * configs saved by earlier versions load without migration. Every value is
 * coerced to its field type on load and on apply, so consumers always receive
 * numbers as numbers and booleans as booleans.
 */
export class ConfigManager {
  constructor() {
    this._defaults = this._buildDefaults();
    this._config = structuredClone(this._defaults);
  }

  /* ── public getters ─────────────────────────────────── */

  get(key) {
    return this._config[key];
  }

  getAll() {
    return structuredClone(this._config);
  }

  /** Config block for a format id, or null if unknown. */
  getFormatConfig(formatId) {
    if (!formatRegistry.has(formatId)) return null;
    return { ...this._config[formatId] };
  }

  getCommon() {
    const out = {};
    for (const group of Object.keys(COMMON_DEFAULTS)) {
      out[group] = { ...this._config[group] };
    }
    return out;
  }

  getCurrentFormat() {
    return this._config.currentFormat;
  }

  isKeyboardEnabled() {
    return this._config.keyboardControlsEnabled;
  }

  /** Every configurable field with its dotted path (used by the UI). */
  sections() {
    return [...formatRegistry.list().map(formatSection), ...COMMON_SECTIONS];
  }

  /* ── mutation ─────────────────────────────────────────── */

  /**
   * Switch the active format. Persists immediately and emits `format:changed`.
   * @returns {boolean} true if the format changed
   */
  setCurrentFormat(formatId) {
    if (!formatRegistry.has(formatId) || formatId === this._config.currentFormat) {
      return false;
    }
    this._config.currentFormat = formatId;
    this.save();
    eventBus.emit('format:changed', { format: formatId });
    return true;
  }

  /**
   * Bulk-apply a partial config object coming from the UI (raw input values
   * are accepted and coerced). Persists and emits `config:applied`.
   */
  apply(partial) {
    this._merge(partial);
    this.save();
    eventBus.emit('config:applied', { config: this.getAll() });
  }

  /* ── persistence ──────────────────────────────────────── */

  save() {
    storageService.set(STORAGE_KEYS.config, this._config);
  }

  load() {
    const saved = storageService.get(STORAGE_KEYS.config);
    if (saved && typeof saved === 'object') {
      this._merge(saved);
    }
  }

  reset() {
    this._config = structuredClone(this._defaults);
    storageService.remove(STORAGE_KEYS.config);
    eventBus.emit('config:reset', {});
  }

  /* ── private ──────────────────────────────────────────── */

  _buildDefaults() {
    const cfg = {
      currentFormat: DEFAULT_FORMAT,
      keyboardControlsEnabled: defaultKeyboardEnabled(),
      ...structuredClone(COMMON_DEFAULTS),
    };
    for (const fmt of formatRegistry.list()) {
      cfg[fmt.id] = { ...fmt.defaults };
    }
    return cfg;
  }

  /** Merge a (possibly partial, possibly untyped) source into the config. */
  _merge(source) {
    if (formatRegistry.has(source.currentFormat)) {
      this._config.currentFormat = source.currentFormat;
    }
    for (const section of this.sections()) {
      for (const field of section.fields) {
        const path = fieldPath(field);
        const raw = getPath(source, path);
        if (raw === undefined) continue;
        const fallback = getPath(this._defaults, path);
        setPath(this._config, path, coerceFieldValue(field, raw, fallback));
      }
    }
  }
}

const configManager = new ConfigManager();
export default configManager;
