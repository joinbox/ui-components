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

    /**
     * Helper class for AsyncLoader to find template content and display it in a designated container
     */
    class Template {

        #rootElement;
        #contentContainer;

        /**
         * @param {HTMLElement} element
         * @param {string} contentContainerSelector
         */
        constructor(element, contentContainerSelector) {
            this.#rootElement = element;
            this.#contentContainer = this.#getContentContainer(contentContainerSelector);
        }

        /**
         * Searches and returns a child element of "rootElement" using a css selector
         * to be used as the container for the content.
         * @param {string} selector
         * @return {HTMLElement}
         */
        #getContentContainer(selector) {
            const container = this.#rootElement.querySelector(selector);
            if (!container) {
                throw new Error(`Could not find container to place content within; no child element matches selector ${selector}.`);
            }
            return container;
        }

        /**
         * Finds first matching element using an array of css selectors
         *
         * @param {string[]} selectors
         * @return {HTMLElement|null}
         */
        #getTemplate(selectors) {
            return selectors.reduce((previousMatch, selector) => (
                previousMatch || this.#rootElement.querySelector(selector)
            ), null);
        }

        /**
         * Replaces content in a template; see generateContent method
         *
         * @param {string} template
         * @param {Object.<string, string>} replacements
         * @return {string}
         */
        #replaceTemplateContent(template, replacements) {
            return Array.from(Object.entries(replacements))
                .reduce((prev, [key, value]) => (
                    prev.replaceAll(`{{${key}}}`, value)
                ), template);
        }

        /**
         * Gets a child template that matches selector, replaces its content and displays it
         *
         * @param {string[]} selectors                    Array CSS selectors.
         *                                                Finds the first matching template
         * @param {Object.<string, string>} replacements  Object of entries that should be replaced
         *                                                in the template's content. Key is the
         *                                                variables name which will be surrounded by
         *                                                two curly braces (key 'message' will look for
         *                                                '{{message}}' to be replaced)
         * @param {boolean} throwIfNotFound               Specify to throw an error if template is not
         *                                                found. Used for mandatory templates.
         */
        generateContent(selectors, replacements = null, throwIfNotFound = false) {
            const template = this.#getTemplate(selectors);
            if (!template) {
                if (throwIfNotFound) {
                    throw new Error(`Could not find child element that matches any selector ${selectors}.`);
                } else {
                    return;
                }
            }
            const templateContent = template.innerHTML;
            this.setContent(
                replacements
                    ? this.#replaceTemplateContent(templateContent, replacements)
                    : templateContent,
            );
        }

        /**
         * Puts passed content string in "contentContainer"
         *
         * @param {string} content
         */
        setContent(content) {
            this.#contentContainer.innerHTML = content;
        }
    }

    /* global HTMLElement, window, CustomEvent */

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

        /**
         * @type {Array}
         */
        #teardownTriggerEventListeners

        #loadingStatus = this.#loadingStates.initial;

        #template;

        constructor() {
            super();

            this.endpointURL = readAttribute(
                this,
                'data-endpoint-url',
            );

            /**
             * @deprecated Use data-trigger-event-names instead
             */
            const triggerEventName = readAttribute(
                this,
                'data-trigger-event-name',
            );

            const triggerEventNames = readAttribute(
                this,
                'data-trigger-event-names',
                {
                    transform: (value) => (value ? value.split(/\s*,\s*/) : []),
                    validate: (value) => value.length > 0 || triggerEventName,
                    expectation: 'a comma-separated list of event names',
                },
            );

            // Merge deprecated value with new value
            this.triggerEventNames = [triggerEventName, ...triggerEventNames];

            this.eventEndpointPropertyName = readAttribute(
                this,
                'data-event-endpoint-property-name',
            );

            this.triggerEventFilter = readAttribute(
                this,
                'data-trigger-event-filter',
            );

            this.loadOnce = readAttribute(
                this,
                'data-load-once',
                {
                    transform: (value) => value === '',
                },
            );

            if (!(this.endpointURL || this.eventEndpointPropertyName)) {
                throw new Error('The attributes "data-endpoint-url" or "data-event-endpoint-property-name" were not found but one of them needs to be set.');
            }

            this.#template = new Template(this, '[data-content-container]');
        }

        connectedCallback() {
            this.#setupTriggerEventListener();
        }

        disconnectedCallback() {
            this.#teardownTriggerEventListeners.forEach((teardown) => teardown());
        }

        /**
         * Listen to event specified in data-trigger-event-names
         */
        #setupTriggerEventListener() {
            this.#teardownTriggerEventListeners = this.triggerEventNames.map(
                (eventName) => createListener(
                    window,
                    eventName,
                    this.#handleTriggerEvent.bind(this),
                ),
            );
        }

        /**
         * Tests if event dispatched passes filter in case trigger-event-filter was provided
         */
        #handleTriggerEvent(event) {
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
            if (!fetchURL) throw new Error(`The property ${this.eventEndpointPropertyName} either has no value or was not found in the payload of the "${event.type}" Event`);

            // If content should only be loaded once, return if fetch request was started or succeeded
            const requestIsLoadingOrLoaded = [this.#loadingStates.loading, this.#loadingStates.loaded]
                .includes(this.#loadingStatus);
            if (this.loadOnce && requestIsLoadingOrLoaded) return;
            this.#fetchData(fetchURL);
        }

        async #fetchData(fetchURL) {
            this.#loadingStatus = this.#loadingStates.loading;
            this.#template.generateContent(['[data-loading-template]']);
            try {
                const response = await fetch(fetchURL);
                if (!response.ok) {
                    this.#handleError(`Status ${response.status}`, response, response.status);
                } else {
                    const content = await response.text();
                    this.#loadingStatus = this.#loadingStates.loaded;
                    this.#template.setContent(content);
                    this.#dispatchStatusEvent(response);
                }
            } catch (error) {
                this.#handleError(error.message, fetchURL);
                // Do not prevent error from being handled correctly; JSDOM displays an "Unhandled
                // rejection" error, therefore ignore it for now
                // throw error;
            }
        }

        /**
         * @param {string} message
         * @param {Response} response - Instance of Response
         *                              (https://developer.mozilla.org/en-US/docs/Web/API/Response)
         * @param {number?} statusCode
         */
        #handleError(message, response, statusCode = null) {
            this.#loadingStatus = this.#loadingStates.failed;
            this.#dispatchStatusEvent(response, true);

            const errorTemplateSelectors = [
                ...(statusCode ? [`[data-error-${statusCode}-template]`] : []),
                '[data-error-template]',
            ];

            this.#template.generateContent(errorTemplateSelectors, { message }, true);
        }

        #dispatchStatusEvent(response, failed = false) {
            const type = failed ? 'asyncLoaderFail' : 'asyncLoaderSuccess';
            const payload = {
                bubbles: true,
                detail: {
                    // Property url is deprecated; remove with next major release; is replaced by
                    // response.url
                    url: response.url,
                    response,
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
