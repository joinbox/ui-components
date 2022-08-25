import canReadAttributes from '../../../src/shared/canReadAttributes.js';
import createListener from '../../../src/shared/createListener.mjs';

/* global HTMLElement, window */

/**
 * Custom element that loads content through XHR. Displays error messages if such are encountered.
 */
export default class extends HTMLElement {

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
        const loadingTemplate = this.querySelector(selector);
        if (!loadingTemplate) {
            console.warn(`AsyncLoader: Could not find child element that matches selector ${selector}.`);
            return;
        }
        const templateContent = loadingTemplate.innerHTML;
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
