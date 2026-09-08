import { describe, it, expect } from 'vitest';
import AcademicFormat from '../../src/formats/AcademicFormat.js';
import BPFormat from '../../src/formats/BPFormat.js';
import { buildCommonPhases } from '../../src/formats/commonPhases.js';
import { FormatRegistry } from '../../src/formats/FormatRegistry.js';

describe('AcademicFormat', () => {
  it('generates 4 openings + 2*N rebuttals + 2 conclusions by default', () => {
    const phases = AcademicFormat.generatePhases();
    expect(phases).toHaveLength(4 + 2 * 3 + 2);
    expect(phases[0]).toEqual({ name: 'Introducción Equipo A (a favor)', duration: 240 });
    expect(phases.at(-1)).toEqual({ name: 'Conclusión Equipo A (a favor)', duration: 180 });
  });

  it('uses the shorter time only for the last rebuttal round when enabled', () => {
    const phases = AcademicFormat.generatePhases({
      numRefutaciones: 2,
      ultimaRefutacionDiferente: true,
      ultimaRefutacionTime: 90,
    });
    const rebuttals = phases.filter((p) => p.name.startsWith('Refutación'));
    expect(rebuttals.map((p) => p.duration)).toEqual([300, 300, 90, 90]);
  });

  it('ignores the last-rebuttal time when the toggle is off', () => {
    const phases = AcademicFormat.generatePhases({ numRefutaciones: 2, ultimaRefutacionDiferente: false });
    const rebuttals = phases.filter((p) => p.name.startsWith('Refutación'));
    expect(rebuttals.map((p) => p.duration)).toEqual([300, 300, 300, 300]);
  });

  it('uses the configured team names', () => {
    const phases = AcademicFormat.generatePhases({ equipo1Name: 'Rojos', equipo2Name: 'Azules' });
    expect(phases[1].name).toBe('Preguntas cruzadas a Rojos');
    expect(phases.at(-2).name).toBe('Conclusión Azules (en contra)');
  });

  it('does not include deliberation/feedback (handled by commonPhases)', () => {
    expect(AcademicFormat.generatePhases().some((p) => p.name.includes('Deliberación'))).toBe(false);
  });
});

describe('BPFormat', () => {
  it('generates the eight BP speeches with the same duration', () => {
    const phases = BPFormat.generatePhases({ speechTime: 300 });
    expect(phases).toHaveLength(8);
    expect(phases.every((p) => p.duration === 300)).toBe(true);
    expect(phases[0].name).toBe('Primer Ministro (Equipo A)');
    expect(phases[7].name).toBe('Látigo de la Oposición (Equipo D)');
  });
});

describe('buildCommonPhases', () => {
  it('appends deliberation and feedback from config with defaults', () => {
    expect(buildCommonPhases()).toEqual([
      { name: 'Deliberación de jueces', duration: 600 },
      { name: 'Feedback', duration: 900 },
    ]);
    expect(buildCommonPhases({ feedback: { time: 60 } })[1]).toEqual({ name: 'Feedback', duration: 60 });
  });
});

describe('FormatRegistry', () => {
  const fake = {
    id: 'ld',
    label: 'Lincoln-Douglas',
    shortcut: '3',
    defaults: { a: 1 },
    fields: [{ key: 'a', label: 'A', type: 'number' }],
    generatePhases: () => [],
  };

  it('registers and lists formats in order', () => {
    const reg = new FormatRegistry();
    reg.register(AcademicFormat).register(fake);
    expect(reg.ids()).toEqual(['academico', 'ld']);
    expect(reg.get('ld')).toBe(fake);
    expect(reg.has('nope')).toBe(false);
    expect(reg.byShortcut('3')).toBe(fake);
  });

  it('rejects invalid modules', () => {
    const reg = new FormatRegistry();
    expect(() => reg.register({ id: 'x' })).toThrow(/label/);
    expect(() => reg.register(null)).toThrow(/objeto/);
  });

  it('rejects duplicate ids and shortcuts', () => {
    const reg = new FormatRegistry();
    reg.register(fake);
    expect(() => reg.register({ ...fake })).toThrow(/duplicado/);
    expect(() => reg.register({ ...fake, id: 'other' })).toThrow(/Atajo/);
  });
});
