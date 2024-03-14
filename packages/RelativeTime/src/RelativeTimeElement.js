import RelativeTime from './RelativeTime.js';

/* global window */
if (!window.customElements.get('relative-time')) {
    window.customElements.define('relative-time', RelativeTime);
}
