import { Overlay, OverlayButton } from '../main.mjs';

/* Define custom elements for browser testing (OverlayTest.html) */

/* global window */
window.customElements.define('jb-overlay-button', OverlayButton);
window.customElements.define('jb-overlay', Overlay);

