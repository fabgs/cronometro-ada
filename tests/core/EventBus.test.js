import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../src/core/EventBus.js';

describe('EventBus', () => {
  it('delivers payloads to subscribers', () => {
    const bus = new EventBus();
    const cb = vi.fn();
    bus.on('x', cb);
    bus.emit('x', { a: 1 });
    expect(cb).toHaveBeenCalledWith({ a: 1 });
  });

  it('returns an unsubscribe function', () => {
    const bus = new EventBus();
    const cb = vi.fn();
    const off = bus.on('x', cb);
    off();
    bus.emit('x');
    expect(cb).not.toHaveBeenCalled();
  });

  it('isolates handler errors', () => {
    const bus = new EventBus();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ok = vi.fn();
    bus.on('x', () => {
      throw new Error('boom');
    });
    bus.on('x', ok);
    bus.emit('x');
    expect(ok).toHaveBeenCalled();
    spy.mockRestore();
  });
});
