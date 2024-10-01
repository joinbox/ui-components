/* global HTMLElement, customElements, CustomEvent, history */

/**
 * Updates the current location's query parameters to match the current filters.
 */
export default class QueryStringUpdater extends HTMLElement {
    connectedCallback() {
        this.#emitAddHandlerEvent();
    }

    /**
     * Element registers itself at the surrounding DynamicContentLoader that orchestrates API
     * calls.
     */
    async #emitAddHandlerEvent() {
        // Make sure the event is only fired after surrounding DynamicContentLoader is ready,
        // even the script that defines it is loaded after this one.
        await new Promise((resolve) => setTimeout(resolve));
        this.dispatchEvent(new CustomEvent('addDynamicContentHandler', {
            bubbles: true,
            detail: {
                updateResponseStatus: this.#updateResponseStatus.bind(this),
                assembleURL: () => null,
            },
        }));
    }

    #updateResponseStatus(statusUpdate) {
        if (statusUpdate.status !== 'loading') return;
        // eslint-disable-next-line no-restricted-globals
        history.pushState(null, '', statusUpdate.requestConfiguration.queryString);
    }

    static defineCustomElement() {
        if (!customElements.get('query-string-updater')) {
            customElements.define('query-string-updater', QueryStringUpdater);
        }
    }
}

