import canAnnounceElement from '../../../src/shared/canAnnounceElement.js';
import createListener from '../../../src/shared/createListener.mjs';

/* global HTMLElement, window */

export default class MediaTimelineComponent extends HTMLElement {

    // Only update value on input when user is not seeking
    isSeeking = false;

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
            throw new Error(`TimelineComponent: Must contain a child that matches ${selector} on initialization.`);
        }
        this.input = input;
    }

    /**
     * Listens to input changes on input
     */
    setupInputListeners() {
        createListener(this.input, 'change', this.updateTime.bind(this));
        // Don't update value of input[type="range"] while we're seeking; input wouldn't play
        // nicely with audio if we did
        createListener(this.input, 'mousedown', () => { this.isSeeking = true; });
        createListener(window, 'mouseup', () => { this.isSeeking = false; });
    }

    /**
     * Updates volume on audio
     * @private
     */
    updateTime() {
        // Audio is not loaded yet: Prevent user from interacting with the timeline
        if (!this.model.loadingState) return;
        const time = this.input.value;
        this.model.setCurrentTime(time);
    }

    /**
     * Listens to changes on AudioModel
     * @private
     */
    setupModelListeners() {
        this.model.on('canplaythrough', () => {
            this.input.max = this.model.getDuration();
        });
        this.model.on('timeupdate', this.updateValue.bind(this));
    }

    /**
     * Updates volume (value) on input
     * @param {number} value 
     * @private
     */
    updateValue() {
        // Don't update value (that will trigger change event) while the user is changing
        // the current time.
        if (this.isSeeking) return;
        const time = this.model.getCurrentTime();
        this.input.value = time;
    }

}
