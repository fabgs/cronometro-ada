import { toInt } from './time.js';

/**
 * Configuration schema helpers.
 *
 * A *field* describes one configurable value:
 *   { group, key, label, type: 'text'|'number'|'checkbox',
 *     step?, min?, max?, placeholder?, hint?, showWhen? }
 *
 * `group` is the top-level config key the value lives under (a format id,
 * `deliberacion`, `feedback`…). When omitted the value is top-level.
 * `showWhen` names a sibling checkbox field that must be checked for this
 * field to be visible.
 *
 * Format modules declare their own fields; the sections below cover the
 * values shared by every format.
 */

export const COMMON_SECTIONS = [
  {
    id: 'fases-adicionales-config',
    label: 'Fases Adicionales',
    fields: [
      { group: 'deliberacion', key: 'time', label: 'Deliberación (seg)', type: 'number', step: 60, min: 0 },
      { group: 'deliberacion', key: 'description', label: 'Descripción Deliberación', type: 'text', placeholder: 'Ej: Deliberación de jueces' },
      { group: 'feedback', key: 'time', label: 'Feedback (seg)', type: 'number', step: 60, min: 0 },
      { group: 'feedback', key: 'description', label: 'Descripción Feedback', type: 'text', placeholder: 'Ej: Feedback' },
    ],
  },
  {
    id: 'controles-config',
    label: 'Controles',
    fields: [
      {
        key: 'keyboardControlsEnabled',
        label: 'Activar controles de teclado',
        type: 'checkbox',
        hint: 'Permite usar atajos de teclado para controlar el cronómetro (Espacio, flechas, etc.)',
      },
    ],
  },
];

/** Build the config section for a format module. */
export function formatSection(format) {
  return {
    id: `${format.id}-config`,
    formatId: format.id,
    label: format.label,
    fields: format.fields.map((f) => ({ ...f, group: format.id })),
  };
}

/** Dotted path of a field inside the config object. */
export function fieldPath(field) {
  return field.group ? `${field.group}.${field.key}` : field.key;
}

/** Stable DOM id for a field's input. */
export function fieldInputId(field) {
  return `cfg-${fieldPath(field).replace(/\./g, '-')}`;
}

export function getPath(obj, path) {
  return path.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
}

export function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((acc, k) => {
    if (acc[k] == null || typeof acc[k] !== 'object') acc[k] = {};
    return acc[k];
  }, obj);
  target[last] = value;
  return obj;
}

/**
 * Coerce a raw value (string from an input, or anything from storage) to
 * the field's type, using `fallback` when the value is invalid.
 */
export function coerceFieldValue(field, raw, fallback) {
  switch (field.type) {
    case 'number':
      return toInt(raw, fallback, { min: field.min, max: field.max });
    case 'checkbox':
      return typeof raw === 'boolean' ? raw : Boolean(fallback);
    case 'text': {
      const str = raw == null ? '' : String(raw).trim();
      return str || fallback;
    }
    default:
      return raw ?? fallback;
  }
}
