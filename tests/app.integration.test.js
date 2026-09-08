import { describe, it, expect, beforeAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Boots the real application (index.html + main.js) inside jsdom and checks
 * that the UI is generated from the FormatRegistry and that the two
 * persistence bugs fixed in this branch stay fixed.
 */

const STORAGE_KEY = 'ada-debate-config';
const press = (key) => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY));

describe('App (integration)', () => {
  let configManager;
  let phaseManager;
  let formatRegistry;

  beforeAll(async () => {
    // jsdom lacks matchMedia
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });

    // Simulate a config saved by a previous session (legacy string values)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ currentFormat: 'academico', academico: { introTime: '300', equipo1Name: 'Rojos' } }),
    );

    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    document.body.innerHTML = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));

    await import('../src/main.js');
    ({ default: configManager } = await import('../src/core/ConfigManager.js'));
    ({ default: phaseManager } = await import('../src/core/PhaseManager.js'));
    ({ default: formatRegistry } = await import('../src/formats/FormatRegistry.js'));
  });

  it('renders one selector button per registered format', () => {
    const buttons = [...document.querySelectorAll('.format-btn')];
    expect(buttons.map((b) => b.dataset.format)).toEqual(formatRegistry.ids());
    expect(buttons.map((b) => b.textContent)).toEqual(formatRegistry.list().map((f) => f.label));
    expect(document.querySelector('.format-btn.active').dataset.format).toBe('academico');
  });

  it('renders a config section per format plus the common ones', () => {
    const ids = [...document.querySelectorAll('#config-sections details')].map((d) => d.id);
    expect(ids).toEqual(['academico-config', 'bp-config', 'fases-adicionales', 'controles']);
    const academicInputs = document.querySelectorAll('#academico-config [data-path]');
    expect(academicInputs).toHaveLength(formatRegistry.get('academico').fields.length);
  });

  it('shows the persisted values in the form (not the HTML defaults)', () => {
    expect(document.querySelector('#cfg-academico-introTime').value).toBe('300');
    expect(document.querySelector('#cfg-academico-equipo1Name').value).toBe('Rojos');
    expect(phaseManager.phases[0]).toEqual({ name: 'Introducción Rojos (a favor)', duration: 300 });
  });

  it('generates format phases followed by the common phases', () => {
    const names = phaseManager.phases.map((p) => p.name);
    expect(names.at(-2)).toBe('Deliberación de jueces');
    expect(names.at(-1)).toBe('Feedback');
  });

  it('switches format by keyboard shortcut and persists it immediately', () => {
    press('2');
    expect(configManager.getCurrentFormat()).toBe('bp');
    expect(saved().currentFormat).toBe('bp');
    expect(document.querySelector('.format-btn.active').dataset.format).toBe('bp');
    expect(phaseManager.phases[0].name).toBe('Primer Ministro (Equipo A)');
    expect(phaseManager.total).toBe(8 + 2);
  });

  it('switches format by clicking its button', () => {
    document.querySelector('.format-btn[data-format="academico"]').click();
    expect(configManager.getCurrentFormat()).toBe('academico');
    expect(saved().currentFormat).toBe('academico');
  });

  it('opens the config drawer with only the active format section expanded', () => {
    press('2'); // active format: bp
    document.querySelector('#config-btn').click();
    const open = [...document.querySelectorAll('#config-sections details')].filter((d) => d.open).map((d) => d.id);
    expect(open).toEqual(['bp-config']);
    document.querySelector('#config-close').click();

    press('1'); // active format: academico
    document.querySelector('#config-btn').click();
    const open2 = [...document.querySelectorAll('#config-sections details')].filter((d) => d.open).map((d) => d.id);
    expect(open2).toEqual(['academico-config']);
    document.querySelector('#config-close').click();
  });

  it('expands the section of a format selected while the drawer is open', () => {
    document.querySelector('#config-btn').click();
    press('2');
    expect(document.querySelector('#bp-config').open).toBe(true);
    press('1');
    document.querySelector('#config-close').click();
  });

  it('applies the form and regenerates the phases', () => {
    document.querySelector('#config-btn').click();
    expect(document.querySelector('#config-panel').classList.contains('open')).toBe(true);
    document.querySelector('#cfg-academico-numRefutaciones').value = '1';
    document.querySelector('#cfg-academico-equipo2Name').value = 'Azules';
    document.querySelector('#apply-config-btn').click();
    expect(saved().academico.numRefutaciones).toBe(1);
    expect(phaseManager.phases.filter((p) => p.name.startsWith('Refutación'))).toHaveLength(2);
    expect(phaseManager.phases.some((p) => p.name.includes('Azules'))).toBe(true);
    expect(document.querySelector('#config-panel').classList.contains('open')).toBe(false);
  });

  it('hides conditional fields when their checkbox is off', () => {
    const toggle = document.querySelector('#cfg-academico-ultimaRefutacionDiferente');
    const dependent = document.querySelector('[data-show-when="cfg-academico-ultimaRefutacionDiferente"]');
    expect(dependent.hidden).toBe(false);
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change', { bubbles: true }));
    expect(dependent.hidden).toBe(true);
  });

  it('lists format shortcuts in the keyboard help', () => {
    const text = document.querySelector('#keyboard-help-panel').textContent;
    for (const f of formatRegistry.list()) expect(text).toContain(f.label);
  });
});
