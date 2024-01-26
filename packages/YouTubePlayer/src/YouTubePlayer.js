import { readAttribute } from '../../tools/main.mjs';
import createListener from '../../../src/shared/createListener.mjs';
import loadYouTubeAPI from './loadYouTubeAPI.js';

/* global HTMLElement, window, document */

/**
 * Replaces content on click with YouTube movie that auto-plays.
 */
export default class YouTubePlayer extends HTMLElement {

    #disconnectMouseEnter;
    #disconnectClick;

    // Attributes read from DOM
    #loadingClass;
    #playerVars;
    #videoId;

    /**
     * YouTube player for the current video; is exposed publicly for outside code to be
     * able to interact with the video through pause/play (e.g. when the video plays
     * in an overlay and should be paused once the overlay is closed)
     * @public
     * @type {Promise}
     */
    player;

    /**
     * Function to resolve the YouTube player
     * @type {Function}
     */
    #resolvePlayer;

    /**
     * Promise that resolves once the YouTube API is ready. Undefined if the player hasn't started
     * loading
     * @type {undefined|Promise}
     */
    #youTubeAPI;

    constructor() {
        super();
        this.#readAttributes();
        this.#preparePlayerPromise();
    }

    connectedCallback() {
        // Preload YouTube API as soon as a user might play the video (by hovering the video
        // with the mouse)
        this.#disconnectMouseEnter = createListener(
            this,
            'mouseenter',
            this.#loadYouTubeAPI.bind(this),
        );
        this.#disconnectClick = createListener(
            this,
            'click',
            this.#handleClick.bind(this),
        );
    }

    disconnectedCallback() {
        this.#disconnectMouseEnter();
        this.#disconnectClick();
    }

    #readAttributes() {
        this.#videoId = readAttribute(
            this,
            'data-video-id',
            {
                validate: (value) => !!value,
                expectation: 'a non-empty string',
            },
        );
        this.#playerVars = readAttribute(
            this,
            'data-player-variables',
            {
                // JSON.parse is gonna throw if invalid; no need for a dedicated validation
                transform: (value) => JSON.parse(value),
            },
        );
        this.#loadingClass = readAttribute(
            this,
            'data-loading-class-name',
        );
    }

    /**
     * Creates a promise for this.player that can be resolved from the outside
     */
    #preparePlayerPromise() {
        this.player = new Promise((resolve) => {
            this.#resolvePlayer = resolve;
        });
    }

    #handleClick(event) {
        event.preventDefault();
        this.#updateDOM();
        this.#play();
    }

    /**
     * Loads the YouTube API, if not already loading
     * @type {Promise}
     */
    #loadYouTubeAPI() {
        if (!this.#youTubeAPI) {
            this.#youTubeAPI = loadYouTubeAPI();
        }
        return this.#youTubeAPI;
    }

    /**
     * Wait for YouTube player to be ready, create player and add it to a newly created child
     * div.
     */
    async #play() {
        const YTPlayer = await this.#loadYouTubeAPI();
        this.#updateDOM(true);
        // Don't replace current element, add the video as a child
        // eslint-disable-next-line no-new
        const player = new YTPlayer(this.querySelector('div'), {
            playerVars: this.#playerVars,
            videoId: this.#videoId,
            events: {
                onReady: ({ target }) => target.playVideo(),
            },
        });
        // Resolve a bit early (instead of onReady) as JSDOM cannot load YouTube Player and we
        //  would not be able to test if we relied on onReady which will never fire
        this.#resolvePlayer(player);
    }

    /**
     * Updates DOM according to status passed
     */
    #updateDOM(loaded = false) {
        if (!loaded) {
            this.classList.add(this.#loadingClass);
        } else {
            // Remove content (preview image and play button)
            this.innerHTML = '<div></div>';
            this.classList.remove(this.#loadingClass);
        }
    }

}
