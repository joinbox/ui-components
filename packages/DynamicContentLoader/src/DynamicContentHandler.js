/* global HTMLElement, customElements, CustomEvent */

/**
 * Generic implementation that updates content of the element when dynamic content is loaded. Used
 * e.g. to update the pagination. Uses the endpoint from arguments and appends the query string from
 * the request that is made.
 */
export default class DynamicContentHandler extends HTMLElement {
    #endpointURL;

    connectedCallback() {
        this.#emitAddEvent();
    }

    /**
     * Element registers itself at the surrounding DynamicContentLoader that orchestrates API
     * calls.
     */
    async #emitAddEvent() {
        // Make sure the event is only fired after surrounding DynamicContentLoader is ready,
        // even the script that defines it is loaded after this one.
        await new Promise((resolve) => setTimeout(resolve));
        this.dispatchEvent(new CustomEvent('addDynamicContentHandler', {
            bubbles: true,
            detail: {
                updateResponseStatus: this.#updateResponseStatus.bind(this),
                assembleURL: this.#assembleURL.bind(this),
            },
        }));
    }

    #updateResponseStatus(statusUpdate) {
        // TODO: Work with templates?
        if (statusUpdate.status === 'loading') {
            this.style.opacity = 0.3;
        } else if (statusUpdate.status === 'loaded') {
            this.style.opacity = 1;
            this.innerHTML = statusUpdate.content;
        } else if (statusUpdate.status === 'failed') {
            this.style.opacity = 1;
            this.innerHTML = `ERROR: Status ${statusUpdate.response.status} – ${statusUpdate.content}`;
        }
    }

    #getEndpointURL() {
        if (!this.#endpointURL) {
            if (!this.dataset.endpointUrl) throw new Error('Attribute endpoint-url is missing.');
            this.#endpointURL = this.dataset.endpointUrl;

        }
        return this.dataset.path;
    }

    #assembleURL({ queryString }) {
        const url = `${this.#getEndpointURL()}${queryString}`;
        return url;
    }

    static defineCustomElement() {
        if (!customElements.get('dynamic-content-handler')) {
            customElements.define('dynamic-content-handler', DynamicContentHandler);
        }
    }
}

