import AsyncLoader from './AsyncLoader.js';

/* global window */
if (!window.customElements.get('async-loader')) {
    window.customElements.define('async-loader', AsyncLoader);
}
