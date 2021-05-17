import MediaTimeComponent from './MediaTimeComponent.js';

/* global window */
if (!window.customElements.get('media-time-component')) {
    window.customElements.define('media-time-component', MediaTimeComponent);
}
