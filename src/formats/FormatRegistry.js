import AcademicFormat from './AcademicFormat.js';
import BPFormat from './BPFormat.js';

/**
 * FormatRegistry — the single place that knows which debate formats exist.
 *
 * Every other module (ConfigManager, ConfigPanel, FormatSelector,
 * KeyboardService, KeyboardHelp…) iterates this registry instead of
 * hard-coding format ids, so adding a format is: create the module and
 * register it at the bottom of this file.
 *
 * Format module contract:
 *   { id: string, label: string, shortcut?: string,
 *     defaults: object, fields: Field[], generatePhases(cfg): Phase[] }
 */
export class FormatRegistry {
  constructor() {
    /** @type {Map<string, object>} */
    this._formats = new Map();
  }

  register(format) {
    FormatRegistry.validate(format);
    if (this._formats.has(format.id)) {
      throw new Error(`[FormatRegistry] Formato duplicado: "${format.id}"`);
    }
    if (format.shortcut) {
      const clash = this.byShortcut(format.shortcut);
      if (clash) {
        throw new Error(`[FormatRegistry] Atajo "${format.shortcut}" ya usado por "${clash.id}"`);
      }
    }
    this._formats.set(format.id, format);
    return this;
  }

  get(id) {
    return this._formats.get(id);
  }

  has(id) {
    return this._formats.has(id);
  }

  /** All registered format modules, in registration order. */
  list() {
    return [...this._formats.values()];
  }

  ids() {
    return [...this._formats.keys()];
  }

  /** Find the format bound to a keyboard shortcut. */
  byShortcut(key) {
    return this.list().find((f) => f.shortcut === key);
  }

  static validate(format) {
    const problems = [];
    if (!format || typeof format !== 'object') {
      problems.push('el módulo debe ser un objeto');
    } else {
      if (typeof format.id !== 'string' || !format.id) problems.push('id (string) requerido');
      if (typeof format.label !== 'string' || !format.label) problems.push('label (string) requerido');
      if (!format.defaults || typeof format.defaults !== 'object') problems.push('defaults (object) requerido');
      if (!Array.isArray(format.fields)) problems.push('fields (array) requerido');
      if (typeof format.generatePhases !== 'function') problems.push('generatePhases (function) requerido');
    }
    if (problems.length) {
      throw new Error(`[FormatRegistry] Formato inválido: ${problems.join(', ')}`);
    }
  }
}

const formatRegistry = new FormatRegistry();

// Built-in formats. To add a new one: create src/formats/XFormat.js and register it here.
formatRegistry.register(AcademicFormat);
formatRegistry.register(BPFormat);

export default formatRegistry;
