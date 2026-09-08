import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PhaseManager } from '../../src/core/PhaseManager.js';
import timer from '../../src/core/Timer.js';
import eventBus from '../../src/core/EventBus.js';

const PHASES = [
  { name: 'A', duration: 10 },
  { name: 'B', duration: 20 },
  { name: 'C', duration: 30 },
];

describe('PhaseManager', () => {
  let pm;

  beforeEach(() => {
    vi.useFakeTimers();
    eventBus.clear();
    timer.load(0);
    pm = new PhaseManager();
    pm.setPhases([...PHASES]);
  });

  afterEach(() => {
    timer.load(0);
    vi.useRealTimers();
    eventBus.clear();
  });

  it('starts at the first phase and loads its duration', () => {
    expect(pm.currentIndex).toBe(0);
    expect(pm.currentPhase.name).toBe('A');
    expect(timer.totalTime).toBe(10);
  });

  it('navigates forward and backward within bounds', () => {
    pm.nextPhase();
    pm.nextPhase();
    pm.nextPhase(); // no-op at the end
    expect(pm.currentIndex).toBe(2);
    expect(timer.totalTime).toBe(30);
    pm.previousPhase();
    pm.previousPhase();
    pm.previousPhase(); // no-op at the start
    expect(pm.currentIndex).toBe(0);
  });

  it('jumps to a valid index only', () => {
    pm.jumpToPhase(2);
    expect(pm.currentIndex).toBe(2);
    pm.jumpToPhase(7);
    expect(pm.currentIndex).toBe(2);
  });

  it('refuses navigation while the timer runs', () => {
    timer.start();
    pm.nextPhase();
    pm.jumpToPhase(2);
    expect(pm.currentIndex).toBe(0);
  });

  it('resetDebate returns to the first phase and emits events', () => {
    const reset = vi.fn();
    const changed = vi.fn();
    eventBus.on('debate:reset', reset);
    eventBus.on('phase:changed', changed);
    pm.jumpToPhase(2);
    pm.resetDebate();
    expect(pm.currentIndex).toBe(0);
    expect(reset).toHaveBeenCalled();
    expect(changed).toHaveBeenLastCalledWith({ index: 0, phase: PHASES[0], total: 3 });
  });
});
