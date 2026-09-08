import eventBus from '../core/EventBus.js';

/**
 * Component — base class for UI components.
 *
 * Components attach behaviour to markup that already exists in index.html
 * (or that they create themselves in `mount`). The base class tracks every
 * EventBus subscription and DOM listener so `destroy()` can undo all of them.
 *
 * Lifecycle: constructor → mount() → destroy()
 */
class Component {
  constructor() {
    /** @type {Function[]} EventBus unsubscribe callbacks */
    this._unsubs = [];
    /** @type {Array<{target: EventTarget, type: string, handler: Function, options: *}>} */
    this._domBindings = [];
  }

  /** Subscribe to the EventBus; automatically removed on destroy. */
  listen(event, callback) {
    const unsub = eventBus.on(event, callback);
    this._unsubs.push(unsub);
    return unsub;
  }

  /** Add a DOM listener; automatically removed on destroy. Ignores null targets. */
  bindDom(target, type, handler, options) {
    if (!target) return;
    target.addEventListener(type, handler, options);
    this._domBindings.push({ target, type, handler, options });
  }

  /** Override — query DOM nodes and bind listeners. */
  mount() {}

  /** Remove all EventBus subscriptions and DOM listeners. */
  destroy() {
    this._unsubs.forEach((fn) => fn());
    this._unsubs = [];
    this._domBindings.forEach(({ target, type, handler, options }) => {
      target.removeEventListener(type, handler, options);
    });
    this._domBindings = [];
  }
}

export default Component;
