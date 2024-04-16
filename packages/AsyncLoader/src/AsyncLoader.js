import readAttribute from '../../tools/src/readAttribute.mjs';
import createListener from '../../../src/shared/createListener.mjs';
import Template from './Template.mjs';

/* global HTMLElement, window, CustomEvent */

/**
 * Custom element that loads content through XHR. Displays error messages if such are encountered.
 */
export default class extends HTMLElement {

    #loadingStates = {
        initial: 'initial',
        loading: 'loading',
        failed: 'failed',
        loaded: 'loaded',
    };

    /**
     * @type {string[]}
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
