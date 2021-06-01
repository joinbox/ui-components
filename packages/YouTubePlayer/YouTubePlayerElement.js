(function () {
    'use strict';

    /**
     * Simplifies watching attributes; pass in a config and this mixin will automatically store
     * attribute values in a component to reduce DOM reads and simplify validation.
     * IMPORTANT: We might want to use observable attributes in the future; we did not do so now,
     * because
     * a) it's hard to add the static method to he class that consumes the mixin
     * b) there is no JSDOM support for observable attributes, which makes testing a pain
     * @param {object[]} config     Attribute config; each entry may consist of the following
     *                              properties:
     *                              - name (string, mandatory): Name of the attribute to watch
     *                              - validate (function, optional): Validation function; return a
     *                                falsy value if validation is not passed
     *                              - property (string, optional): Class property that the value
     *                                should be stored in; if not set, name will be used instead
     *                              - transform (function): Transforms value before it is saved as a
     *                                property
     */
    var canReadAttributes = (config) => {

        if (!config.every(item => item.name)) {
            throw new Error(`canReadAttribute: Every config entry must be an object with property name; you passed ${JSON.stringify(config)} instead.`);
        }

        return {
            readAttributes() {
                config.forEach((attributeConfig) => {
                    const {
                        name,
                        validate,
                        property,
                        transform,
                    } = attributeConfig;
                    // Use getAttribute instead of dataset, as attribute is not guaranteed to start
                    // with data-
                    const value = this.getAttribute(name);
                    if (typeof validate === 'function' && !validate(value)) {
                        throw new Error(`canWatchAttribute: Attribute ${name} does not match validation rules`);
                    }
                    const transformFunction = transform || (initialValue => initialValue);
                    const propertyName = property || name;
                    this[propertyName] = transformFunction(value);
                });
            },
        };

    };

    /**
     * Adds event listener to an element and returns removeEventListener function that only needs to
     * be called to de-register an event.
     * @example
     * const disposer = createListener(window, 'click', () => {});
     */
    var createListener = (element, eventName, handler) => {
        // Takes this from execution context which must be the custom element
        element.addEventListener(eventName, handler);
        return () => element.removeEventListener(eventName, handler);
    };

    /* global window, document */

    /**
     * Loads YouTube API and returns Player or only returns Player if it is already loaded.
     */
    var loadYouTubeAPI = async() => {

        const youTubeScriptURL = 'https://www.youtube.com/iframe_api';

        // YouTube script was already loaded, Player is ready
        if (window.YT && window.YT.Player && typeof window.YT.Player === 'function') {
            return Promise.resolve(window.YT.Player);
        }
        // Check if there is already a YouTube script: If there is, just wait until it's done
        const existingTag = document.querySelector(`script[src="${youTubeScriptURL}"]`);

        // There is no script tag: Create and add it to the DOM
        if (!existingTag) {
            const tag = document.createElement('script');
            tag.setAttribute('src', youTubeScriptURL);
            document.body.appendChild(tag);
        }

        return new Promise((resolve) => {
            window.onYouTubeIframeAPIReady = () => resolve(window.YT.Player);
        });

    };

    /* global HTMLElement, window, document */

    /**
     * Replaces content on click with YouTube movie that auto-plays.
     */
    class YouTubePlayer extends HTMLElement {

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
            new Player(this.querySelector('div'), {
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

    /* global window */
    if (!window.customElements.get('youtube-player-component')) {
        window.customElements.define('youtube-player-component', YouTubePlayer);
    }

}());
