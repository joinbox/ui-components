(function () {
    'use strict';

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

    /**
     * Button that opens or closes or toggles an overlay. Requires
     * attributes data-button-type (open/close/toggle) and data-overlay-name.
     */
    class OverlayButton extends HTMLElement {

        constructor() {
            super();
            this.readAttributes();
            Object.assign(
                this,
                canAnnounceElement({ eventType: 'overlay-button', eventIdentifier: this.name }),
            );
            this.setupClickListener();
        }

        async connectedCallback() {
            await this.announce();
            this.handleModelChanges();
            this.updateDOM();
        }

        readAttributes() {
            this.name = this.getName();
            this.type = this.getType();
            const [openClass, closedClass] = this.getClassNames();
            this.openClass = openClass;
            this.closedClass = closedClass;
        }

        getClassNames() {
            return [
                getAndValidateAttribute({
                    element: this,
                    name: 'data-open-class-name',
                }),
                getAndValidateAttribute({
                    element: this,
                    name: 'data-closed-class-name',
                }),
            ];
        }

        /**
         * Reads overlay name from DOM, stores it in this.name
         * @private
         */
        getName() {
            return getAndValidateAttribute({
                element: this,
                name: 'data-overlay-name',
                validate: value => value && typeof value === 'string',
            });
        }

        /**
         * Reads button type from DOM, stores it in this.type. Defaults to 'toggle'.
         * @private
         */
        getType() {
            return getAndValidateAttribute({
                element: this,
                name: 'data-type',
                validate: value => !value || ['toggle', 'open', 'close'].includes(value),
            }) || 'toggle';
        }

        /**
         * @private
         */
        setupClickListener() {
            createListener(this, 'click', this.handleClick.bind(this));
        }

        /**
         * @private
         */
        handleClick() {
            this.model[this.type]();
        }

        /**
         * @private
         */
        handleModelChanges() {
            this.model.on('change', this.updateDOM.bind(this));
        }

        /**
         * @private
         */
        updateDOM() {
            /* global requestAnimationFrame */
            requestAnimationFrame(() => {
                if (this.model.isOpen) {
                    this.classList.remove(this.closedClass);
                    this.classList.add(this.openClass);
                } else {
                    this.classList.remove(this.openClass);
                    this.classList.add(this.closedClass);
                }
            });
        }

    }

    /* global window */
    if (!window.customElements.get('overlay-button-component')) {
        window.customElements.define('overlay-button-component', OverlayButton);
    }

})();
