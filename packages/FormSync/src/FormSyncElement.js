import FormSync from './FormSync.js';

/* global window */
if (!window.customElements.get('form-sync')) {
    window.customElements.define('form-sync', FormSync);
}
