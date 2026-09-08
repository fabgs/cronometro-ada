import Component from './Component.js';
import themeService from '../services/ThemeService.js';

/**
 * DarkModeToggle — sun/moon toggle button wired to ThemeService.
 */
export class DarkModeToggle extends Component {
  mount() {
    this.bindDom(document.querySelector('#dark-mode-toggle'), 'click', () => themeService.toggle());

    this.listen('keyboard:action', ({ action }) => {
      if (action === 'toggleDarkMode') themeService.toggle();
    });
  }
}
