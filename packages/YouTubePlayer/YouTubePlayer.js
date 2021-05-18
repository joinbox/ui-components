import canReadAttributes from '../../src/shared/canReadAttributes.js';
import createListener from '../../src/shared/createListener.mjs';
import loadYouTubeAPI from './loadYouTubeAPI.js';

/* global HTMLElement, window, document */

/**
 * Replaces content on click with YouTube movie that auto-plays.
 */
export default class YouTubePlayer extends HTMLElement {

    /**
     * Player instance or, if not ready, promise
     */
    player = undefined;

    /**
     * Player's current status. Either null, 'loading' or 'ready';
     */
    status = null;

    constructor() {
        super();
        Object.assign(
            this,
            canReadAttributes([{
                name: 'data-video-id',
                validate: value => !!value,
                property: 'videoID',
            }, {
                name: 'data-player-variables',
                property: 'playerVars',
                transform: value => JSON.parse(value),
            }, {
                name: 'data-loading-class-name',
                property: 'loadingClass',
            }]),
        );
        this.readAttributes();
    }

    /**
     * @private
     */
    connectedCallback() {
        this.disconnectMouseEnter = createListener(
            this,
            'mouseenter',
            this.handleMouseEnter.bind(this),
        );
        this.disconnectClick = createListener(
            this,
            'click',
            this.handleClick.bind(this),
        );
    }

    /**
     * @private
     */
    disconnectedCallback() {
        this.disconnectMouseEnter();
    }

    /**
     * Preload YouTube API when mouse enters player
     * @private
     */
    handleMouseEnter() {
        this.player = loadYouTubeAPI();
    }

    /**
     * @private
     */
    async handleClick(event) {
        event.preventDefault();
        if (!this.player) this.player = loadYouTubeAPI();
        this.status = 'loading';
        this.updateDOM();
        this.play();
    }

    /**
     * Wait for YouTube player to be ready, create player and add it to a newly created child
     * div.
     * @private
     */
    async play() {
        const Player = await this.player;
        this.status = 'ready';
        await this.updateDOM();
        // Don't replace current element, add the video as a child
        const player = new Player(this.querySelector('div'), {
            playerVars: this.playerVars,
            videoId: this.videoID,
            events: {
                onReady: ev => ev.target.playVideo(),
            },
        });
    }

    /**
     * Updates DOM; returns a promise that resolves as soon as the update was executed. Needed as
     * we can only initialize the YouTube player with an element that is part of the document.
     * @private
     */
    updateDOM() {
        return new Promise((resolve) => {
            window.requestAnimationFrame(() => {
                if (this.status === 'loading') {
                    this.classList.add(this.loadingClass);
                } else if (this.status === 'ready') {
                    // Remove content (preview image and play button)
                    this.innerHTML = '<div></div>';
                    this.classList.remove(this.loadingClass);
                }
                resolve();
            });
        });
    }

}
