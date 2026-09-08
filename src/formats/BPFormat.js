/**
 * BPFormat — British Parliamentary debate (eight speeches, four teams).
 * See AcademicFormat.js for the format module contract.
 */

const defaults = {
  speechTime: 420,
  camaraAltaFavor: 'Equipo A',
  camaraAltaContra: 'Equipo B',
  camaraBajaFavor: 'Equipo C',
  camaraBajaContra: 'Equipo D',
};

const fields = [
  { key: 'speechTime', label: 'Duración discursos (seg)', type: 'number', step: 30, min: 0 },
  { key: 'camaraAltaFavor', label: 'Cámara Alta (a favor)', type: 'text', placeholder: 'Ej: Equipo A' },
  { key: 'camaraAltaContra', label: 'Cámara Alta (en contra)', type: 'text', placeholder: 'Ej: Equipo B' },
  { key: 'camaraBajaFavor', label: 'Cámara Baja (a favor)', type: 'text', placeholder: 'Ej: Equipo C' },
  { key: 'camaraBajaContra', label: 'Cámara Baja (en contra)', type: 'text', placeholder: 'Ej: Equipo D' },
];

/**
 * @param {object} cfg - already-coerced BP config
 * @returns {Array<{name: string, duration: number}>}
 */
function generatePhases(cfg = {}) {
  const c = { ...defaults, ...cfg };
  const d = c.speechTime;
  return [
    { name: `Primer Ministro (${c.camaraAltaFavor})`, duration: d },
    { name: `Líder de Oposición (${c.camaraAltaContra})`, duration: d },
    { name: `Viceprimer Ministro (${c.camaraAltaFavor})`, duration: d },
    { name: `Vicelíder de Oposición (${c.camaraAltaContra})`, duration: d },
    { name: `Extensión de Gobierno (${c.camaraBajaFavor})`, duration: d },
    { name: `Extensión de la Oposición (${c.camaraBajaContra})`, duration: d },
    { name: `Látigo de Gobierno (${c.camaraBajaFavor})`, duration: d },
    { name: `Látigo de la Oposición (${c.camaraBajaContra})`, duration: d },
  ];
}

export default {
  id: 'bp',
  label: 'British Parliament',
  shortcut: '2',
  defaults,
  fields,
  generatePhases,
};
