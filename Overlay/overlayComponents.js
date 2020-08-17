import Overlay from './Overlay.js';
import OverlayButton from './OverlayButton.js';

/* Define customElements  – only needed for tests (that work best with an entry point file),
don't use otherwise! */

/* global window */
window.customElements.define('jb-overlay-button', OverlayButton);
window.customElements.define('jb-overlay', Overlay);
