/* global customElements, HTMLElement */

// eslint-disable-next-line import/extensions
import Request from './Request';
// eslint-disable-next-line import/extensions
import RequestPool from './RequestPool';

/**
 * Connects everything when it comes to Facets / dynamic UI filters:
 * - Listens for 'addDynamicContentHandler' event and registers those
 * - Listens for 'loadDynamicContent' event; once it happens, uses RequestPool to get the fetch
 *   URL from all handlers, fetches the content and distributes it to all handlers
 *
 * Is basically a custom element around RequestPool.
 */
export default class DynamicContentOrchestrator extends HTMLElement {

    /**
     * Instance of RequestPool that orchestrates all fetch calls
     * type {RequestPool}
     */
    #requestPool;

    constructor() {
        super();
        this.#requestPool = new RequestPool(Request);
    }

    connectedCallback() {
        this.#setupLoadDynamicContentHandler();
        this.#setupAddDynamicContentHandlerHandler();
    }

    #setupLoadDynamicContentHandler() {
        this.addEventListener('loadDynamicContent', this.#loadContent.bind(this));
    }

    /**
     * Handles loadDynamicContent events
     * @param {{ detail: { requestConfiguration: { queryString: QueryString} }}} param0
     */
    #loadContent({ detail: { requestConfiguration } } = {}) {
        // Argument checking is done in RequestPool
        this.#requestPool.loadContent(requestConfiguration);
    }

    #setupAddDynamicContentHandlerHandler() {
        this.addEventListener('addDynamicContentHandler', this.#addHandler.bind(this));
    }

    #addHandler({ detail: handler }) {
        this.#requestPool.addHandler(handler);
    }

    static defineCustomElement() {
        if (!customElements.get('dynamic-content-orchestrator')) {
            customElements.define('dynamic-content-orchestrator', DynamicContentOrchestrator);
        }
    }
}
