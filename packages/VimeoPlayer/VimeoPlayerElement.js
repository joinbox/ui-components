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
     * Loads Vimeo API if needed and else returns the Player object
     */
    var loadVimeoAPI = async() => {
        /* global window, document */
        const url = 'https://player.vimeo.com/api/player.js';
        if (window.Vimeo && window.Vimeo.Player) return Promise.resolve(window.Vimeo.Player);

        // If there is already a script tag with the corresponding URL, re-use it
        let scriptTag = document.querySelector(`script[src="${url}"]`);
        return new Promise((resolve, reject) => {
            // If there is no script tag, create it
            if (!scriptTag) {
                scriptTag = document.createElement('script');
            }
            scriptTag.addEventListener('load', () => resolve(window.Vimeo.Player));
            scriptTag.addEventListener(
                'error',
                () => reject(new Error('Vimeo script could not be loaded'))
            );
            // If scriptTag was newly created, we must append it to the body
            if (!scriptTag.closest('body')) {
                scriptTag.setAttribute('src', url);
                document.body.appendChild(scriptTag);
            }
        });

    };

    /* global HTMLElement */

    /**
     * Replaces content on click with YouTube movie that auto-plays in muted mode. Then tries to
     * unmute video. See
     * https://vimeo.zendesk.com/hc/en-us/articles/115004485728-Autoplaying-and-looping-embedded-videos
     */
    class VimeoPlayer extends HTMLElement {

        baseURL = 'https://player.vimeo.com/video/';
        allow = ['autoplay', 'fullscreen'];
        parameters = {
            autoplay: 'true',
            // Muted is needed for autoplay on some devices (e.g. Safari/iOS); see this.unmute()
            muted: 'true',
        }
        attributes = 'width="640" height="360" frameborder="0" allowfullscreen';
        /**
         * Stores the original content of the element (before the video was displayed); needed to
         * restore and to check if video is already being displayed
         */
        originalContent = null

        constructor() {
            super();
            Object.assign(
                this,
                canReadAttributes([{
                    name: 'data-video-id',
                    validate: value => !!value,
                    property: 'videoId',
                }]),
            );
            this.readAttributes();
        }

        connectedCallback() {
            this.setupClickListener();
        }

        /**
         * Generate IFrame url from this class' properties
         * @returns {string}
         */
        generateIFrameURL() {
            const parameters = new URLSearchParams(this.parameters);
            return `<iframe src="${this.baseURL}${this.videoId}?${parameters}" allow="${this.allow.join(';')}" ${this.attributes}></iframe>`;
        }

        setupClickListener() {
            this.addEventListener('click', this.insertVideo.bind(this));
        }

        /**
         * Restore original content in video (e.g. poster image)
         */
        restore() {
            if (!this.originalContent) {
                throw new Error('VimeoPlayer: this.originalContent is not set; make sure you only restore the original content after the video was dispalyed.')
            }
            this.innerHTML = this.originalContent;
            this.originalContent = null;
        }

        /**
         * Replace content of custom element with Vimeo player
         */
        insertVideo() {
            // If video is already being displayed, there is no need to replace it again; it would
            // e.g. reset the current playing state
            if (this.orignalContent) return;
            this.originalContent = this.innerHTML;
            this.innerHTML = this.generateIFrameURL();
            this.unmute();
        }

        /**
         * Some browsers (e.g. Safari on iOS) do not allow unmuted videos to be autoplayed. As it is
         * hard/impossible to discover those browsers, go the opposite way:
         * 1. Mute the video
         * 2. Try to unmute it afterwards through the Vimeo Player API
         * 3. If video stops playing, the browser does not support autoplay on unmuted videos
         * 4. Mute the video again and restart playing
         */
        async unmute() {
            const iframe = this.querySelector('iframe');
            if (!iframe) {
                throw new Error(`VimeoPlayer: IFrame not found in content, is ${this.innerHTML}`);
            }
            // Load the player from CDN asynchronously to improve loading performance and to not have
            // to mess around with non-ES modules (such as @vimeo/player)
            // Store promise and player in class property to enable unit testing (we must await the
            // promise)
            this.vimeoPlayerPromise = loadVimeoAPI();
            const Player = await this.vimeoPlayerPromise;
            this.player = new Player(iframe);
            // Make sure we don't access the player before it's ready
            await this.player.ready();
            // Wait until player fires first timeupdate (which means the video is effectively playing)
            // – before, time may not elapse and getPaused() might be wrong
            await new Promise(resolve => this.player.on('timeupdate', resolve));
            await this.player.setVolume(1);
            // Wait until the volume change has been taking place (seems to take some time especially
            // on mobile devices … there is no event we can wait for)
            await new Promise(resolve => setTimeout(resolve, 0));
            const isPaused = await this.player.getPaused();
            if (isPaused) {
                await this.player.setVolume(0);
                await this.player.play();
            }

        }

    }

    /* global window */
    if (!window.customElements.get('vimeo-player')) {
        window.customElements.define('vimeo-player', VimeoPlayer);
    }

}());
