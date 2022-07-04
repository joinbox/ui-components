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

    /* global HTMLElement */

    /**
     * Displays time, either current or total
     */
    class MediaTime extends HTMLElement {

        constructor() {
            super();
            Object.assign(this, canAnnounceElement());
            // Cache type
            this.getType();
        }

        getType() {
            this.type = getAndValidateAttribute({
                element: this,
                name: 'data-type',
            }) || 'current';
        }

        async connectedCallback() {
            await this.announce();
            this.setupModelListeners();
        }

        setupModelListeners() {
            // Only listen to timeupdate if type is current
            if (this.type === 'current') {
                this.model.on('timeupdate', () => this.updateDOM(this.model.getCurrentTime()));
            } else {
                this.model.on('canplaythrough', () => this.updateDOM(this.model.getDuration()));
            }
        }

        updateDOM(timeStamp) {
            /* global requestAnimationFrame */
            requestAnimationFrame(() => {
                this.textContent = this.formatTime(timeStamp);
            });
        }

        formatTime(timeStamp) {
            const rounded = Math.floor(timeStamp);
            const pad = nr => (nr < 10 ? `0${nr}` : nr);
            return `${Math.floor(rounded / 60)}:${pad(rounded % 60)}`;
        }

    }

    /* global window */
    if (!window.customElements.get('media-time-component')) {
        window.customElements.define('media-time-component', MediaTime);
    }

})();
