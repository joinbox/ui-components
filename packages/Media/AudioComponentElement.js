(function () {
    'use strict';

    /**
     * Simple EventEmitter mixin; use our own implementation as a) most NPM modules don't provide an
     * ES6 export and b) they're not made to be used as mixins.
     * Export a function for all mixins, even if not needed here (consistency).
     */
    var canEmitEvents = () => {

        return {

            /**
             * Map that holds all callbacks for all types
             * @type Map.<*, function[]>
            */
            eventHandlers: new Map(),

            /**
             * Adds event handler for a given type
             * @param {*} type               Name of the event handler
             * @param {function} callback    Callback to call if corresponding event is emitted
            */
            on(type, callback) {
                if (!this.eventHandlers.has(type)) this.eventHandlers.set(type, [callback]);
                else this.eventHandlers.get(type).push(callback);
            },

            /**
             * Removes an event handler; if only type is given, all callbacks of the type will be
             * removed. If type and callback are given, only the specific callbacks for the given type
             * will be removed.
             * @param {*} type               Type of event handler to remove
             * @param {function} callback    Callback to remove
             */
            off(type, callback) {
                if (!this.eventHandlers.has(type)) return;
                if (!callback) this.eventHandlers.delete(type);
                else {
                    this.eventHandlers.set(
                        type,
                        this.eventHandlers.get(type).filter(cb => cb !== callback),
                    );
                }
            },

            /**
             * Calls all callbacks of the provided type with the given parameters.
             * @param {*} type          Type of eventHandler to call
             * @param {...*} params     Parameters to pass to callbacks
             */
            emit(type, ...params) {
                (this.eventHandlers.get(type) || []).forEach(handler => handler(...params));
            },
        };

    };

    /**
     * Abstraction of HTML Audio element that is shared between all components.
     */
    class AudioModel {

        /**
         * Audio's loading state, either null, 'loading' or 'loaded'
         */
        loadingState = null;
        /**
         * Audio's playing state; separate from loadingState to play audio after it was loaded *if*
         * user has started playing and not paused audio afterwards. Separate from audio's play state
         * for the same reason.
         */
        playing = false;

        constructor() {
            Object.assign(this, canEmitEvents());
        }

        setURL(url) {
            this.url = url;
        }

        load() {
            this.loadingState = 'loading';
            this.emit('load');
            /* global Audio */
            this.audio = new Audio(this.url);
            // Without calling load explicitly, audio won't load on iOS, see
            // https://stackoverflow.com/questions/49792768/js-html5-audio-why-is-canplaythrough-not-fired-on-ios-safari
            this.audio.load();
            this.setupAudioListeners();
        }

        getDuration() {
            return this.audio && this.audio.duration;
        }

        getVolume() {
            return this.audio && this.audio.volume;
        }

        getCurrentTime() {
            return this.audio && this.audio.currentTime;
        }

        /**
         * Maps events from Audio instance to internal EventEmitter events that are listened to by
         * components
         * @private
         */
        setupAudioListeners() {
            this.audio.addEventListener('play', () => {
                this.emit('play');
                this.playing = true;
            });
            this.audio.addEventListener('timeupdate', (ev) => {
                this.emit('timeupdate', ev.timeStamp);
            });
            this.audio.addEventListener('pause', () => {
                this.emit('pause');
                this.playing = false;
            });
            this.audio.addEventListener('volumechange', (ev) => {
                this.emit('volumechange', this.getVolume());
            });
            this.audio.addEventListener('canplaythrough', async() => {
                // Timeout is needed to test loading state on AudioComponent; loads too fast to see
                // data-state="loading" in the DOM without the Timeout
                // await new Promise(resolve => setTimeout(resolve, 1000));
                this.emit('canplaythrough');
                this.loadingState = 'loaded';
                // If user clicked play to load audio and did not pause afterwards, play audio
                if (this.playing) this.play();
            });
            this.audio.addEventListener('error', console.error);
        }

        play() {
            this.playing = true;
            if (this.loadingState !== 'loaded') return;
            this.audio.play();
        }

        pause() {
            this.playing = false;
            if (this.loadingState !== 'loaded') return;
            this.audio.pause();
        }

        setVolume(volume) {
            this.audio.volume = volume;
        }

        setCurrentTime(time) {
            this.audio.currentTime = time;
        }

    }

    /**
     * Mixin for a component that announces itself by dispatching an event
     * @example 
     * class extends HTMLElement {
     *     constructor() {
     *         Object.assign(this, canRegisterElements({ eventTarget: this }));
     *     }
     *     connectedCallback() {
     *         this.registerAnnouncements();
     *     }
     * }
     * */
    var canRegisterElements = ({
        eventName = 'announce-element',
        eventTarget = window, // Does that work?
        eventType,
        eventIdentifier,
        model,
    } = {}) => (
        {
            registerAnnouncements() {
                eventTarget.addEventListener(eventName, (ev) => {
                    const { detail } = ev;
                    if (eventType && detail.eventType !== eventType) return;
                    if (eventIdentifier && detail.eventIdentifier !== eventIdentifier) return;
                    const { element } = ev.detail;
                    if (typeof element.setModel !== 'function') {
                        console.warn(`canRegisterElement: setModel is not a function on announcing element, but ${element.setModel}.`);
                    } else {
                        element.setModel(model);
                    }
                });
            },
        }
    );

    /**
     * Gets/validates attribute of a HTML element.
     * OUTDATED - use canReadAttributes instead.
     * @param {HTMLElement} options.element
     * @param {name} options.name               Name of the attribute
     * @param {function} options.validate       Validate function; return true if attribute is valid
     * @param {boolean} options.isSet           True if you only want to know if the attribute is
     *                                          set (but do not care about its value).
     * @param {string} errorMessage             Additional error message
     * @return {*}                              String if isSet is false, else boolean
     */
    var getAndValidateAttribute = ({
        element,
        name,
        validate = () => true,
        isSet = false,
        errorMessage = 'HTML attribute not valid',
    } = {}) => {

        if (!name) {
            throw new Error(`getAndValidateAttribute: Pass an argument { name }; you passed ${name} instead.`);
        }
        /* global HTMLElement */
        if (!element || !(element instanceof HTMLElement)) {
            throw new Error(`getAndValidateAttribute: Pass an argument { element } that is a HTMLElement; you passed ${element} instead.`);
        }

        if (isSet) {
            const hasAttribute = element.hasAttribute(name);
            if (validate(hasAttribute) !== true) throw new Error(`getAndValidateAttribute: Attribute ${name} did not pass validation, is ${hasAttribute}: ${errorMessage}.`);
            return hasAttribute;
        }

        // Do not use dataset as it's slower
        // (https://calendar.perfplanet.com/2012/efficient-html5-data-attributes/) and provides
        // less flexibility (in case we don't want the data- prefix)
        const value = element.getAttribute(name);
        if (validate(value) !== true) throw new Error(`getAndValidateAttribute: Attribute ${name} did not pass validation, is ${value}: ${errorMessage}.`);
        return value;

    };

    /* global HTMLElement, requestAnimationFrame */

    class AudioComponent extends HTMLElement {

        constructor() {
            super();
            this.audioModel = new AudioModel();
            Object.assign(this, canRegisterElements({
                eventTarget: this,
                model: this.audioModel,
            }));
            // Audio can be played from different sub-components; set URL instantly so that they
            // can start interacting
            this.audioModel.setURL(this.getAudioURL());
            this.setupModelListeners();
        }

        /**
         * Update DOM when relevant events happen on the model
         * @private
         */
        setupModelListeners() {
            this.audioModel.on('canplaythrough', this.updateDOM.bind(this));
            this.audioModel.on('play', this.updateDOM.bind(this));
            this.audioModel.on('load', this.updateDOM.bind(this));
            this.audioModel.on('pause', this.updateDOM.bind(this));
        }

        /**
         * Listen to child components as soon as element is added to the DOM
         */
        connectedCallback() {
            this.registerAnnouncements();
            // Update state to match model's state
            this.updateDOM();
        }

        /**
         * Returns audio URL that is stored in element's data-source attribute.
         * @private
         */
        getAudioURL() {
            return getAndValidateAttribute({
                element: this,
                name: 'data-source',
                validate: value => value && typeof value === 'string',
            });
        }

        /**
         * Calculates UI state from model's states.
         * @returns {string}
         * @private
         */
        calculateState() {
            // Usually, wile loading state is *also* playing. Therefore test loading first.
            if (this.audioModel.loadingState === 'loading') return 'loading';
            if (this.audioModel.playing) return 'playing';
            // Not playing but loaded: must be paused
            if (this.audioModel.loadingState === 'loaded') return 'paused';
            // Default state: User has not interacted
            return 'initialized';
        }

        /**
         * Update data-state. Set it at one single place for the whole component (not distributed
         * over different child elements).
         * @private
         */
        updateDOM() {
            requestAnimationFrame(() => {
                this.dataset.state = this.calculateState();
            });
        }

    }

    /* global window */
    if (!window.customElements.get('audio-component')) {
        window.customElements.define('audio-component', AudioComponent);
    }

})();
