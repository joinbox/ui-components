(function () {
    'use strict';

    /**
     * Reads, transforms and validates an attribute from an HTML element.
     */
    var readAttribute = (
        element,
        attributeName,
        {
            transform = (value) => value,
            validate = () => true,
            expectation = '(expectation not provided)',
        } = {},
    ) => {
        const value = element.getAttribute(attributeName);
        const transformedValue = transform(value);
        if (!validate(transformedValue)) {
            throw new Error(`Expected attribute ${attributeName} of element ${element.outerHTML} to be ${expectation}; got ${transformedValue} instead (${value} before the transform function was applied).`);
        }
        return transformedValue;
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

    /* global HTMLElement, window , CustomEvent*/

    /**
     * Custom element that loads content through XHR. Displays error messages if such are encountered.
     */
    class AsyncLoader extends HTMLElement {

        #loadingStates = {
            initial: 'initial',
            loading: 'loading',
            failed: 'failed',
            loaded: 'loaded',
        };

        #teardownTriggerEventListener

        #loadingStatus = this.#loadingStates.initial;

        constructor() {
            super();

            this.endpointURL = readAttribute(
                this,
                'data-endpoint-url',
            );

            this.triggerEventName = readAttribute(
                this,
                'data-trigger-event-name',
                {
                    validate: (value) => !!value,
                    expectation: 'a non-empty string',
                }
            );

            this.eventEndpointPropertyName = readAttribute(
                this,
                'data-event-endpoint-property-name',
            );

            this.triggerEventFilter = readAttribute(
                this,
                'data-trigger-event-filter'
            );

            this.loadOnce = readAttribute(
                this,
                'data-load-once',
                {
                    transform: (value) => value === '',
                }
            );

            if (!(this.endpointURL || this.eventEndpointPropertyName)) {
                throw new Error(`The attributes "data-endpoint-url" or "data-event-endpoint-property-name" were not found but one of them needs to be set.`);
            }
        }

        connectedCallback() {
            this.#setupTriggerEventListener();
        }

        disconnectedCallback() {
            this.#teardownTriggerEventListener();
        }

        /**
         * Listen to event specified in data-trigger-event-name
         */
        #setupTriggerEventListener() {
            this.#teardownTriggerEventListener = createListener(
                window,
                this.triggerEventName,
                this.#handleTiggerEvent.bind(this),
            );
        }

        /**
         * Tests if event dispatched passes filter in case trigger-event-filter was provided
         */
        #handleTiggerEvent(event) {
            if (this.triggerEventFilter) {
                // Do not use eval to limit scope of variables that can be accessed; still use JS in the
                // attribute to allow for maximum flexibility.
                try {
                    const filterFunction = Function('event', `return ${this.triggerEventFilter}`);
                    const eventMatchesFilter = filterFunction(event);
                    if (!eventMatchesFilter) return;
                } catch (error) {
                    // Make sure the user understands where the error came from
                    error.message = `The filter function provided through the trigger-event-filter attribute of <async-loader> threw the following error: ${error.message}`;
                    throw error;
                }
            }

            const fetchURL = this.endpointURL || event.detail?.[this.eventEndpointPropertyName];
            if (!fetchURL) throw new Error(`The property ${this.eventEndpointPropertyName} either has no value or was not found in the payload of the "${this.triggerEventName}" Event`);

            // If content should only be loaded once, return if fetch request was started or succeeded
            const requestIsLoadingOrLoaded = [this.#loadingStates.loading, this.#loadingStates.loaded]
                .includes(this.#loadingStatus);
            if (this.loadOnce && requestIsLoadingOrLoaded) return;
            this.#fetchData(fetchURL);
        }

        async #fetchData(fetchURL) {
            this.#loadingStatus = this.#loadingStates.loading;
            this.#displayTemplate('[data-loading-template]');
            try {
                const response = await fetch(fetchURL);
                if (!response.ok) {
                    this.#handleError(`Status ${response.status}`, fetchURL);
                } else {
                    const content = await response.text();
                    this.#dispatchStatusEvent(fetchURL);
                    this.#loadingStatus = this.#loadingStates.loaded;
                    this.#getContentContainer().innerHTML = content;
                }
            } catch (error) {
                this.#handleError(error.message, fetchURL);
                // Do not prevent error from being handled correctly; JSDOM displays an "Unhandled
                // rejection" error, therefore ignore it for now
                // throw error;
            }
        }

        #getContentContainer() {
            const container = this.querySelector('[data-content-container]');
            if (!container) {
                throw new Error('AsyncLoader: Could not find container to place content within; no child element matches selector [data-content-container].');
            }
            return container;
        }

        #handleError(message, fetchURL) {
            this.#loadingStates = this.#loadingStates.failed;
            this.#dispatchStatusEvent(fetchURL, true);
            this.#displayTemplate('[data-error-template]', { message });
        }

        /**
         * Gets a child template that matches selector, replaces its content and displays it
         * @param {string} selector                       CSS selector of the template to use
         * @param {Object.<string, string>} replacements  Object of entries that should be replaced
         *                                                in the template's content. Key is the
         *                                                variables name which will be surrounded by
         *                                                two curly braces (key 'message' will look for
         *                                                '{{message}}' to be replaced)
         */
        #displayTemplate(selector, replacements = {}) {
            const template = this.querySelector(selector);
            if (!template) {
                console.warn(`AsyncLoader: Could not find child element that matches selector ${selector}.`);
                return;
            }
            const templateContent = template.innerHTML;
            const content = this.#replaceContent(templateContent, replacements);
            this.#getContentContainer().innerHTML = content;

        }

        /**
         * Replaces content in a template; see #displayTemplate method
         */
        #replaceContent(template, replacements) {
            const replaced = Array.from(Object.entries(replacements))
                .reduce((prev, [key, value]) => (
                    prev.replaceAll(`{{${key}}}`, value)
                ), template);
            return replaced;
        }

        #dispatchStatusEvent(fetchURL, failed = false) {
            const type = failed ? 'asyncLoaderFail' : 'asyncLoaderSuccess';
            const payload = {
                bubbles: true,
                detail: {
                    url: fetchURL,
                    element: this,
                },
            };
            this.dispatchEvent(new CustomEvent(type, payload));
        }

    }

    /* global window */
    if (!window.customElements.get('async-loader')) {
        window.customElements.define('async-loader', AsyncLoader);
    }

})();
