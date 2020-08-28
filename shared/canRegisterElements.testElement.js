import canRegisterElement from './canRegisterElements.js';

class TestRegistrar extends HTMLElement {

    constructor() {
        super();
        Object.assign(this, canRegisterElement({
            eventName: this.dataset.eventName,
            // Enables injection of eventTarget through window
            eventTarget: window.eventTarget || window,
            eventType: this.dataset.eventType,
            eventIdentifier: this.dataset.eventIdentifier,
            model: 'myModel',
        }));
    }

    connectedCallback() {
        this.registerAnnouncements();
    }
}

window.customElements.define('test-registrar', TestRegistrar);
