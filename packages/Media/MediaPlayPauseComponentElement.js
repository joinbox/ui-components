(function () {
    'use strict';

    /**
     * Mixin for a component that announces itself by dispatching an event. If another element handles
     * the event, it may pass the model to the current component by calling setModel(). The model will
     * be stored in this.model. After model is set, this.onModelChange is called, if available.
     * @example
     * class extends HTMLElement {
     *     constructor() {
     *         Object.assign(this, canAnnounceElement);
     *     }
     *     async connectedCallback() {
     *         await this.announce();
     *         // Now this.model is ready
     *         this.model.on('change', this.update.bind(this));
     *     }
     * }
    */
    var canAnnounceElement = ({ eventName = 'announce-element', eventType, eventIdentifier } = {}) => {

        // Create a (private) promise that is resolved when the model changes (see setModel). Do not
        // define it within the object to not pollute its scope.
        let resolveModelInitializedPromise;
        const modelInitializedPromise = new Promise((resolve) => {
            resolveModelInitializedPromise = resolve;
        });

        return {
            model: undefined,
            /**
             * Dispatches announce event with a short delay; returns a promise that resolves after
             * the event was dispatched.
             */
            announce() {
                /* global CustomEvent */
                const event = new CustomEvent(eventName, {
                    bubbles: true,
                    detail: {
                        element: this,
                        eventType,
                        eventIdentifier,
                    },
                });
                // Short delay to make sure event listeners on parent elements (where the event bubbles
                // to) are ready
                setTimeout(() => {
                    this.dispatchEvent(event);
                });
                // Return promise that is resolved as soon as setModel is called for the first time
                return modelInitializedPromise;
            },
            setModel(model) {
                this.model = model;
                resolveModelInitializedPromise();
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

    /* global window */
    if (!window.customElements.get('media-play-pause-component')) {
        window.customElements.define('media-play-pause-component', MediaPlayPauseButton);
    }

}());
