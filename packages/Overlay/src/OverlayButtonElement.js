import OverlayButton from './OverlayButton.js';

/* global window */
if (!window.customElements.get('overlay-button-component')) {
    window.customElements.define('overlay-button-component', OverlayButton);
}