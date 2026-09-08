/**
 * AcademicFormat — self-describing debate format module.
 *
 * A format owns everything that defines it: id, visible label, keyboard
 * shortcut, default values, configuration fields and phase generation.
 * Nothing outside this file needs to know about it: registering the module
 * in FormatRegistry is enough for the UI, config and keyboard to pick it up.
 */

const defaults = {
  equipo1Name: 'Equipo A',
  equipo2Name: 'Equipo B',
  introTime: 240,
  preguntasTime: 120,
  refutacionTime: 300,
  conclusionTime: 180,
  numRefutaciones: 3,
  ultimaRefutacionDiferente: true,
  ultimaRefutacionTime: 90,
};

const fields = [
  { key: 'equipo1Name', label: 'Nombre Equipo 1', type: 'text', placeholder: 'Ej: Equipo A' },
  { key: 'equipo2Name', label: 'Nombre Equipo 2', type: 'text', placeholder: 'Ej: Equipo B' },
  { key: 'introTime', label: 'Introducción (seg)', type: 'number', step: 30, min: 0 },
  { key: 'preguntasTime', label: 'Preguntas cruzadas (seg)', type: 'number', step: 30, min: 0 },
  { key: 'refutacionTime', label: 'Refutación (seg)', type: 'number', step: 30, min: 0 },
  { key: 'conclusionTime', label: 'Conclusión (seg)', type: 'number', step: 30, min: 0 },
  { key: 'numRefutaciones', label: 'Número de refutaciones', type: 'number', step: 1, min: 1, max: 10 },
  { key: 'ultimaRefutacionDiferente', label: 'Tiempo diferente para última refutación', type: 'checkbox' },
  { key: 'ultimaRefutacionTime', label: 'Última refutación (seg)', type: 'number', step: 30, min: 0, showWhen: 'ultimaRefutacionDiferente' },
];

/**
 * @param {object} cfg - already-coerced academic config (see ConfigManager)
 * @returns {Array<{name: string, duration: number}>}
 */
function generatePhases(cfg = {}) {
  const c = { ...defaults, ...cfg };

  const refutaciones = Array.from({ length: c.numRefutaciones }, (_, i) => {
    const esUltima = i === c.numRefutaciones - 1;
    const duration = c.ultimaRefutacionDiferente && esUltima ? c.ultimaRefutacionTime : c.refutacionTime;
    return [
      { name: `Refutación ${i + 1} - ${c.equipo1Name} (a favor)`, duration },
      { name: `Refutación ${i + 1} - ${c.equipo2Name} (en contra)`, duration },
    ];
  }).flat();

  return [
    { name: `Introducción ${c.equipo1Name} (a favor)`, duration: c.introTime },
    { name: `Preguntas cruzadas a ${c.equipo1Name}`, duration: c.preguntasTime },
    { name: `Introducción ${c.equipo2Name} (en contra)`, duration: c.introTime },
    { name: `Preguntas cruzadas a ${c.equipo2Name}`, duration: c.preguntasTime },
    ...refutaciones,
    { name: `Conclusión ${c.equipo2Name} (en contra)`, duration: c.conclusionTime },
    { name: `Conclusión ${c.equipo1Name} (a favor)`, duration: c.conclusionTime },
  ];
}

export default {
  id: 'academico',
  label: 'Formato Académico',
  shortcut: '1',
  defaults,
  fields,
  generatePhases,
};
