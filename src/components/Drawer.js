import Component from './Component.js';

const q = (selector) => (selector ? document.querySelector(selector) : null);

/**
 * Drawer — shared open/close behaviour for the side panels.
 *
 * Subclasses pass the selectors of their panel, toggle button, close button
 * and backdrop, plus the keyboard action that toggles them. Override
 * `onOpen()` / `onClose()` for extra behaviour.
 */
export class Drawer extends Component {
  /**
   * @param {{panel: string, toggleBtn?: string, closeBtn?: string, backdrop?: string, toggleAction?: string}} sel
   */
  constructor(sel) {
    super();
    this._sel = sel;
    this._isOpen = false;
  }

  mount() {
    this.panel = q(this._sel.panel);
    this._toggleBtn = q(this._sel.toggleBtn);
    this._closeBtn = q(this._sel.closeBtn);
    this._backdrop = q(this._sel.backdrop);

    this.bindDom(this._toggleBtn, 'click', () => this.toggle());
    this.bindDom(this._closeBtn, 'click', () => this.close());
    this.bindDom(this._backdrop, 'click', () => this.close());

    this.listen('keyboard:action', ({ action }) => {
      if (action === this._sel.toggleAction) this.toggle();
      if (action === 'closePanels') this.close();
    });
  }

  get isOpen() {
    return this._isOpen;
  }

  toggle() {
    if (this._isOpen) this.close();
    else this.open();
  }

  open() {
    if (!this.panel || this._isOpen) return;
    this.onOpen();
    this._isOpen = true;
    this.panel.classList.add('open');
    if (this._backdrop) this._backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.panel || !this._isOpen) return;
    this._isOpen = false;
    this.panel.classList.remove('open');
    if (this._backdrop) this._backdrop.classList.remove('active');
    document.body.style.overflow = '';
    this.onClose();
  }

  /** Hook — runs before the panel becomes visible. */
  onOpen() {}

  /** Hook — runs after the panel is hidden. */
  onClose() {}
}
