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

    /* global HTMLElement */

    class MediaVolumeComponent extends HTMLElement {

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
                throw new Error(`VolumeComponent: Must contain a child that matches ${selector} on initialization.`);
            }
            this.input = input;
        }

        /**
         * Listens to input changes on input
         */
        setupInputListeners() {
            createListener(this.input, 'input', this.updateVolume.bind(this));
        }

        /**
         * Updates volume on audio
         * @private
         */
        updateVolume() {
            // Audio is not loaded yet
            if (!this.model.loadingState) return;
            this.model.setVolume(this.input.value / 100);
        }

        /**
         * Listens to changes on AudioModel
         * @private
         */
        setupModelListeners() {
            this.model.on('canplaythrough', () => {
                this.updateValue(this.model.getVolume() * 100);
            });
            this.model.on('volumechange', (volume) => {
                this.updateValue(volume * 100);
            });
        }

        /**
         * Updates volume (value) on input
         * @param {number} value
         * @private
         */
        updateValue(value) {
            this.input.value = value;
        }

    }

    /* global window */
    if (!window.customElements.get('media-volume-component')) {
        window.customElements.define('media-volume-component', MediaVolumeComponent);
    }

}());
