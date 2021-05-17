import canAnnounceElement from '../shared/canAnnounceElement.js';
import createListener from '../shared/createListener.mjs';
import getAndValidateAttribute from '../shared/getAndValidateAttribute.mjs';

/* global HTMLElement, window */

/**
 * Play and pause button for media
 */
export default class MediaPlayPauseButton extends HTMLElement {

    constructor() {
        super();
        // Make element play nicely together with AudioComponent
        Object.assign(this, canAnnounceElement());
        this.setupClickListener();
    }

    /**
     * Announces itself to parent AudioComponent when added to DOM
     */
    async connectedCallback() {
        await this.announce();
    }

    /**
     * Listens to clicks on element
     * @private
     */
    setupClickListener() {
        this.disposeClickListener = createListener(this, 'click', this.toggle);
    }

    /**
     * Toggles between play and pause. If audio has not started loading, it loads the file and
     * plays it when it's loaded, given that playback was not paused in the meantime.
     */
    toggle() {
        // Only load audio data when data is not yet ready and user starts playing
        if (!this.model.loadingState && !this.model.playing) {
            this.model.load();
            // Try to start playing. Will fire 'play' event when file is ready.
            this.model.play();
            return;
        }
        if (this.model.playing) this.model.pause();
        else this.model.play();
    }

}

