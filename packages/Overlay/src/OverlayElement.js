import Overlay from './Overlay.js';

/* global window */
if (!window.customElements.get('overlay-component')) {
    window.customElements.define('overlay-component', Overlay);
}
