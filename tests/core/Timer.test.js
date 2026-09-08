import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Timer } from '../../src/core/Timer.js';
import eventBus from '../../src/core/EventBus.js';

describe('Timer', () => {
  let timer;

  beforeEach(() => {
    vi.useFakeTimers();
    eventBus.clear();
    timer = new Timer();
  });

  afterEach(() => {
    vi.useRealTimers();
    eventBus.clear();
  });

  it('loads a duration and emits a tick', () => {
    const tick = vi.fn();
    eventBus.on('timer:tick', tick);
    timer.load(120);
    expect(timer.currentTime).toBe(120);
    expect(timer.totalTime).toBe(120);
    expect(tick).toHaveBeenCalledWith({ currentTime: 120, totalTime: 120, isRunning: false, isPaused: false });
  });

  it('counts down using wall-clock time', () => {
    timer.load(10);
    timer.start();
    vi.advanceTimersByTime(3000);
    expect(timer.currentTime).toBe(7);
    expect(timer.isRunning).toBe(true);
  });

  it('emits exactly one tick per second change, never duplicates', () => {
    const seen = [];
    eventBus.on('timer:tick', ({ currentTime }) => seen.push(currentTime));
    timer.load(10);
    timer.start();
    vi.advanceTimersByTime(3000); // 15 samples at 200 ms
    expect(seen).toEqual([10, 9, 8, 7]);
  });

  it('still shows every second when a callback is delayed (main thread busy)', () => {
    const seen = [];
    eventBus.on('timer:tick', ({ currentTime }) => seen.push(currentTime));
    timer.load(40);
    timer.start();
    // Simulate ~900 ms of blocked main thread: the clock advances but no
    // sampling callback ran. The next sample must still show 39, not skip it.
    vi.setSystemTime(Date.now() + 900);
    vi.advanceTimersByTime(200);
    expect(seen.at(-1)).toBe(39);
    vi.advanceTimersByTime(1000);
    expect(seen).toEqual([40, 39, 38]);
  });

  it('re-samples immediately when the tab becomes visible', () => {
    timer.load(30);
    timer.start();
    vi.setSystemTime(Date.now() + 5000); // background-throttled: no callbacks ran
    expect(timer.currentTime).toBe(30);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(timer.currentTime).toBe(25);
  });

  it('keeps counting into overtime instead of stopping', () => {
    timer.load(2);
    timer.start();
    vi.advanceTimersByTime(5000);
    expect(timer.currentTime).toBe(-3);
    expect(timer.isRunning).toBe(true);
  });

  it('pauses and resumes without losing time', () => {
    timer.load(60);
    timer.start();
    vi.advanceTimersByTime(10000);
    timer.pause();
    expect(timer.isPaused).toBe(true);
    expect(timer.isRunning).toBe(false);
    vi.advanceTimersByTime(30000); // paused: no change
    expect(timer.currentTime).toBe(50);
    timer.pause(); // resume
    vi.advanceTimersByTime(5000);
    expect(timer.currentTime).toBe(45);
  });

  it('resets to the loaded duration', () => {
    timer.load(30);
    timer.start();
    vi.advanceTimersByTime(4000);
    timer.reset();
    expect(timer.currentTime).toBe(30);
    expect(timer.isRunning).toBe(false);
    expect(timer.isPaused).toBe(false);
  });

  it('seeks while running and continues from there', () => {
    timer.load(100);
    timer.start();
    timer.seekTo(20);
    vi.advanceTimersByTime(2000);
    expect(timer.currentTime).toBe(18);
  });

  it('only adjusts time when not running and clamps to bounds', () => {
    timer.load(60);
    timer.adjustTime(+30);
    expect(timer.currentTime).toBe(60); // cannot exceed total
    timer.adjustTime(-10);
    expect(timer.currentTime).toBe(50);
    timer.adjustTime(-1000);
    expect(timer.currentTime).toBe(-300); // MIN_NEGATIVE_TIME
    timer.start();
    timer.adjustTime(+10);
    expect(timer.currentTime).toBe(-300);
  });
});
