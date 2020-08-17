import canAnnounceElement from '../shared/canAnnounceElement.js';
import getAndValidateAttribute from '../shared/getAndValidateAttribute.mjs';

/**
 * Displays time, either current or total
 */
export default class AudioTime extends HTMLElement {

    constructor() {
        super();
        Object.assign(this, canAnnounceElement());
        // Cache type
        this.getType();
    }

    getType() {
        this.type = getAndValidateAttribute({
            element: this,
            name: 'data-type',
        }) || 'current';
    }

    async connectedCallback() {
        await this.announce();
        this.setupModelListeners();
    }

    setupModelListeners() {
        // Only listen to timeupdate if type is current
        if (this.type === 'current') {
            this.model.on('timeupdate', () => this.updateDOM(this.model.getCurrentTime()));
        } else {
            this.model.on('canplaythrough', () => this.updateDOM(this.model.getDuration()));
        }
    }

    updateDOM(timeStamp) {
        /* global requestAnimationFrame */
        requestAnimationFrame(() => {
            this.textContent = this.formatTime(timeStamp);
        });
    }

    formatTime(timeStamp) {
        const rounded = Math.floor(timeStamp);
        const pad = nr => (nr < 10 ? `0${nr}` : nr);
        return `${Math.floor(rounded / 60)}:${pad(rounded % 60)}`;
    }

}

window.customElements.define('audio-time-component', AudioTime);