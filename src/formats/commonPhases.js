import { COMMON_DEFAULTS } from '../core/defaults.js';

/**
 * Phases shared by every format, appended after the format-specific speeches.
 * @param {{deliberacion?: {time: number, description: string}, feedback?: {time: number, description: string}}} common
 * @returns {Array<{name: string, duration: number}>}
 */
export function buildCommonPhases(common = {}) {
  const deliberacion = { ...COMMON_DEFAULTS.deliberacion, ...common.deliberacion };
  const feedback = { ...COMMON_DEFAULTS.feedback, ...common.feedback };
  return [
    { name: deliberacion.description, duration: deliberacion.time },
    { name: feedback.description, duration: feedback.time },
  ];
}
