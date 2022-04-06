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

    class MediaTimelineComponent extends HTMLElement {

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

    /* global window */
    if (!window.customElements.get('media-timeline-component')) {
        window.customElements.define('media-timeline-component', MediaTimelineComponent);
    }

}());
