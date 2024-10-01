/* global HTMLElement, customElements, CustomEvent, requestAnimationFrame */

/**
 * Updates the facet (expected amount of results) on checkboxes.
 * Needs DynamicContentLoader to work.
 */
export default class FacetsUpdater extends HTMLElement {

    /**
     * Holds the base URL of the endpoint; queryString will be added
     * @type {string}
     */
    #endpointUrl;

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
        if (statusUpdate.status !== 'loaded') return;
        const json = JSON.parse(statusUpdate.content);
        /* Answer comes in the form of:
         * {
         *   "field_job_location": [
         *     {
         *         "termId": "30",
         *         "isSelected": false,
         *         "matches": 2,
         *         "title": "Basel",
         *         "computedTitle": "Basel (2)"
         *     },
         *   ],
         * }
         */
        Object.entries(json).forEach(([facetName, facets]) => {
            facets.forEach((facetData) => this.#updateFacet(facetName, facetData));
        });
    }

    /**
     * Updates the label's content; code is very, very Drupal-specific
     */
    #updateFacet(facetName, facetData) {
        const selector = `.js-form-item-${facetName.replaceAll('_', '-')}-${facetData.termId}`;
        const formElement = this.querySelector(selector);
        if (!formElement) {
            // This can and will happen (e.g. if only facets with more than 0 results in the
            // unfiltered state are rendered initially): log and ignore it
            console.warn(
                'Form element with selector %s not found for facet %o with name %o; can\'t update it.',
                selector,
                facetData,
                facetName,
            );
            return;
        }
        // TODO: How free are we with that label?
        const label = formElement.querySelector('.input-label-element');
        requestAnimationFrame(() => {
            formElement.toggleAttribute('data-empty-results', facetData.matches === 0);
            label.textContent = facetData.computedTitle;
        });
    }

    #getPath() {
        if (!this.#endpointUrl) {
            if (!this.dataset.endpointUrl) throw new Error('FacetsUpdater: Argument data-path is missing.');
            this.#endpointUrl = this.dataset.endpointUrl;
        }
        return this.#endpointUrl;
    }

    #assembleURL({ queryString }) {
        const url = `${this.#getPath()}${queryString}`;
        return url;
    }

    static defineCustomElement() {
        if (!customElements.get('facets-updater')) {
            customElements.define('facets-updater', FacetsUpdater);
        }
    }
}

