import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager } from '../../src/core/ConfigManager.js';
import eventBus from '../../src/core/EventBus.js';
import { STORAGE_KEYS } from '../../src/core/defaults.js';

const read = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.config));

describe('ConfigManager', () => {
  beforeEach(() => {
    localStorage.clear();
    eventBus.clear();
  });

  afterEach(() => eventBus.clear());

  it('builds defaults from the registered formats and common schema', () => {
    const cm = new ConfigManager();
    const all = cm.getAll();
    expect(all.currentFormat).toBe('academico');
    expect(all.academico.introTime).toBe(240);
    expect(all.bp.speechTime).toBe(420);
    expect(all.deliberacion).toEqual({ time: 600, description: 'Deliberación de jueces' });
    expect(typeof all.keyboardControlsEnabled).toBe('boolean');
  });

  it('exposes one section per format plus the common ones', () => {
    const cm = new ConfigManager();
    const ids = cm.sections().map((s) => s.id);
    expect(ids).toEqual(['academico-config', 'bp-config', 'fases-adicionales', 'controles']);
  });

  it('loads a legacy config with string values and coerces them', () => {
    localStorage.setItem(
      STORAGE_KEYS.config,
      JSON.stringify({
        currentFormat: 'bp',
        academico: { introTime: '300', numRefutaciones: '2', equipo1Name: '  Rojos ' },
        bp: { speechTime: '' },
        deliberacion: { time: '120' },
      }),
    );
    const cm = new ConfigManager();
    cm.load();
    expect(cm.getCurrentFormat()).toBe('bp');
    expect(cm.getFormatConfig('academico')).toMatchObject({ introTime: 300, numRefutaciones: 2, equipo1Name: 'Rojos' });
    expect(cm.getFormatConfig('bp').speechTime).toBe(420); // invalid → default
    expect(cm.getCommon().deliberacion.time).toBe(120);
  });

  it('ignores unknown formats and clamps out-of-range values', () => {
    localStorage.setItem(
      STORAGE_KEYS.config,
      JSON.stringify({
        currentFormat: 'inventado',
        academico: { numRefutaciones: 99, introTime: -5 },
      }),
    );
    const cm = new ConfigManager();
    cm.load();
    expect(cm.getCurrentFormat()).toBe('academico');
    expect(cm.getFormatConfig('academico').numRefutaciones).toBe(10);
    expect(cm.getFormatConfig('academico').introTime).toBe(0);
    expect(cm.getFormatConfig('inventado')).toBeNull();
  });

  it('setCurrentFormat persists and emits format:changed', () => {
    const cm = new ConfigManager();
    const spy = vi.fn();
    eventBus.on('format:changed', spy);
    expect(cm.setCurrentFormat('bp')).toBe(true);
    expect(read().currentFormat).toBe('bp');
    expect(spy).toHaveBeenCalledWith({ format: 'bp' });
    expect(cm.setCurrentFormat('bp')).toBe(false); // no-op
    expect(cm.setCurrentFormat('zzz')).toBe(false);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('apply coerces raw UI values, persists and emits config:applied', () => {
    const cm = new ConfigManager();
    const spy = vi.fn();
    eventBus.on('config:applied', spy);
    cm.apply({
      academico: { introTime: '270', ultimaRefutacionDiferente: false, equipo2Name: '' },
      keyboardControlsEnabled: false,
      feedback: { description: '  Comentarios ' },
    });
    expect(cm.getFormatConfig('academico')).toMatchObject({
      introTime: 270,
      ultimaRefutacionDiferente: false,
      equipo2Name: 'Equipo B',
    });
    expect(cm.isKeyboardEnabled()).toBe(false);
    expect(cm.getCommon().feedback.description).toBe('Comentarios');
    expect(read().academico.introTime).toBe(270);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('reset restores defaults, clears storage and emits config:reset', () => {
    const cm = new ConfigManager();
    const spy = vi.fn();
    eventBus.on('config:reset', spy);
    cm.apply({ academico: { introTime: 1 } });
    cm.reset();
    expect(cm.getFormatConfig('academico').introTime).toBe(240);
    expect(localStorage.getItem(STORAGE_KEYS.config)).toBeNull();
    expect(spy).toHaveBeenCalled();
  });

  it('getters return copies, never internal references', () => {
    const cm = new ConfigManager();
    cm.getFormatConfig('academico').introTime = 1;
    cm.getAll().bp.speechTime = 1;
    expect(cm.getFormatConfig('academico').introTime).toBe(240);
    expect(cm.getFormatConfig('bp').speechTime).toBe(420);
  });
});
