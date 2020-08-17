import canAnnounceElement from '../shared/canAnnounceElement.js';
import createListener from '../shared/createListener.js';

/* global HTMLElement, window */

export default class MediaVolumeComponent extends HTMLElement {

    constructor() {
        super();
        Object.assign(this, canAnnounceElement());
        this.getInput();
        this.setupInputListeners();
    }

    async connectedCallback() {
        await this.announce();
        this.setupModelListeners();
    }

    /**
     * Reads input[type=range] from DOM
     */
    getInput() {
        const selector = 'input[type="range"]';
        const input = this.querySelector(selector);
        if (!input) {
            throw new Error(`VolumeComponent: Must contain a child that matches ${selector} on initialization.`);
        }
        this.input = input;
    }

    /**
     * Listens to input changes on input
     */
    setupInputListeners() {
        createListener(this.input, 'input', this.updateVolume.bind(this));
    }

    /**
     * Updates volume on audio
     * @private
     */
    updateVolume() {
        // Audio is not loaded yet
        if (!this.model.loadingState) return;
        this.model.updateVolume(this.input.value / 100);
    }

    /**
     * Listens to changes on AudioModel
     * @private
     */
    setupModelListeners() {
        this.model.on('canplaythrough', () => {
            this.updateValue(this.model.getVolume() * 100);
        });
        this.model.on('volumechange', (volume) => {
            this.updateValue(volume * 100);
        });
    }

    /**
     * Updates volume (value) on input
     * @param {number} value 
     * @private
     */
    updateValue(value) {
        this.input.value = value;
    }

}

window.customElements.define('media-volume-component', MediaVolumeComponent);
