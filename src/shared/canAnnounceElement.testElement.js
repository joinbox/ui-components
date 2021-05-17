import canAnnounceElement from './canAnnounceElement.js';

class TestAnnouncer extends HTMLElement {
    constructor() {
        super();
        Object.assign(this, canAnnounceElement({
            eventName: this.dataset.eventName,
            eventType: this.dataset.eventType,
            eventIdentifier: this.dataset.eventIdentifier,
        }));
    }

    connectedCallback() {
        this.announce();
    }
}

window.customElements.define('test-announcer', TestAnnouncer);
