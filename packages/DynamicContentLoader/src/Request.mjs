/**
 * Represents a XHR that can be canceled at any time, abstracts some response handling and has
 * multiple handlers it might update. Is used by RequestPool to abstract some of its
 * logic (it might call multiple endpoints that each may have multiple handlers).
 * Calls the provided handlers with the following signatures:
 * - loading: { status: 'loading', url: String }
 * - loaded: { status: 'loaded', response: Response, content: String }
 * - failed: { status: 'failed', response: Response, content: String }
 */
export default class {
    #handlers = [];
    #signal;
    #url;

    /**
     * @param {*} params
     * @param {string} params.url - The URL to fetch.
     * @param {AbortSignal} params.signal - The signal that is used to abort the fetch.
     */
    constructor({ url, signal } = {}) {
        if (!url || typeof url !== 'string') {
            throw new Error(`Parameter url must be a non-empty String, is ${url} instead.`);
        }
        this.#url = url;
        if (!signal || !(signal instanceof AbortSignal)) {
            throw new Error(`Parameter signal must be an instance of AbortSignal, is ${signal} instead.`);
        }
        this.#signal = signal;
    }

    /**
     * Public getter for this.#url.
     * @returns {string} The URL to fetch.
     */
    get url() {
        return this.#url;
    }

    /**
     * Adds a handler that will be called with updates for the request.
     * @param {function} handler
     */
    addHandler(handler) {
        if (typeof handler !== 'function') {
            throw new Error(`Parameter handler must be a function, is ${handler} instead.`);
        }
        this.#handlers.push(handler);
    }

    /**
     * Calls all handlers with the data provided.
     * @param {*} data
     */
    #callAllHandlers(data) {
        this.#handlers.forEach((handler) => handler(data));
    }

    /**
     * Fetches the url provided and calls all handlers with updates once they arrive.
     */
    async fetch() {
        this.#callAllHandlers({ status: 'loading', url: this.#url });
        const response = await fetch(this.#url, { signal: this.#signal });
        const content = await response.text();
        const handlerData = {
            response,
            content,
            status: response.ok ? 'loaded' : 'failed',
        };
        this.#callAllHandlers(handlerData);
    }
}
