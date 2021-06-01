import TableOfContents from './TableOfContents.js';

/* global window */
if (!window.customElements.get('table-of-contents-component')) {
    window.customElements.define('table-of-contents-component', TableOfContents);
}
