import AudioComponent from './AudioComponent.js';

/* global window */
if (!window.customElements.get('audio-component')) {
    window.customElements.define('audio-component', AudioComponent);
}
