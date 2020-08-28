import canReadAttributes from './canReadAttributes.js';

/* global window */
window.createWatcher = (config) => {

    class TestWatcher extends window.HTMLElement {
        constructor() {
            super();
            Object.assign(this, canReadAttributes(config));
            this.readAttributes();
        }
    }
    window.customElements.define('test-watcher', TestWatcher);
    // Explose class itself (needed to check static property)
    window.TestWatcher = TestWatcher;

};
