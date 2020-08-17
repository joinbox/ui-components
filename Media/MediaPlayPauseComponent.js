import canAnnounceElement from '../shared/canAnnounceElement.js';
import createListener from '../shared/createListener.js';
import getAndValidateAttribute from '../shared/getAndValidateAttribute.mjs';

/* global HTMLElement, window */

/**
 * Play and pause button for media
 */
class MediaPlayPauseButton extends HTMLElement {

    constructor() {
        super();
        // Make element play nicely together with AudioComponent
        Object.assign(this, canAnnounceElement());
        this.setupClickListener();
        this.getClasses();
    }

    /**
     * Announces itself to parent AudioComponent when added to DOM
     */
    async connectedCallback() {
        await this.announce();
        this.setupModelListeners();
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
        if (!this.model.loadingState && !this.model.playing) this.model.load();
        if (this.model.playing) this.model.pause();
        else this.model.play();
    }

    /**
     * Sets up listeners on model
     * @private
     */
    setupModelListeners() {
        this.model.on('play', this.updateDOM.bind(this));
        this.model.on('pause', this.updateDOM.bind(this));
    }

    /**
     * Reads class attributes from element and stores/caches them
     * @private
     */
    getClasses() {
        this.playingClass = getAndValidateAttribute({
            element: this,
            name: 'data-playing-class',
        });
        this.pausedClass = getAndValidateAttribute({
            element: this,
            name: 'data-paused-class',
        });
    }

    /**
     * Updates the dom
     * @private
     */
    updateDOM() {
        if (this.model.playing) {
            this.classList.add(this.playingClass);
            this.classList.remove(this.pausedClass);
        } else {
            this.classList.add(this.pausedClass);
            this.classList.remove(this.playingClass);
        }
    }

}

/* global window */
window.customElements.define('media-play-pause-component', MediaPlayPauseButton);
