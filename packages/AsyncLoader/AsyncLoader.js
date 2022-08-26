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

    /* global HTMLElement, window */

    /**
     * Custom element that loads content through XHR. Displays error messages if such are encountered.
     */
    class AsyncLoader extends HTMLElement {

        #teardownTriggerEventListener

        constructor() {
            super();
            Object.assign(
                this,
                canReadAttributes([{
                    name: 'data-endpoint-url',
                    property: 'endpointURL',
                    validate: (value) => !!value,
                }, {
                    name: 'data-trigger-event-name',
                    property: 'triggerEventName',
                    validate: (value) => !!value,
                }, {
                    name: 'data-trigger-event-filter',
                    property: 'triggerEventFilter',
                }]),
            );
            this.readAttributes();
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
            this.#fetchData();
        }

        async #fetchData() {
            this.#displayTemplate('[data-loading-template]');
            try {
                const response = await fetch(this.endpointURL);
                if (!response.ok) {
                    this.#displayError(`Status ${response.status}`);
                } else {
                    const content = await response.text();
                    this.#getContentContainer().innerHTML = content;
                }
            } catch (error) {
                this.#displayError(error.message);
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

        #displayError(message) {
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

    }

    return AsyncLoader;

})();
