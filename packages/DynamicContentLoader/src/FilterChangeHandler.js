/* global HTMLElement, customElements, CustomEvent */

/**
 * Custom element that dispatches a loadDynamicContent event when a filter changes. Needs
 * DynamicContentOrchestrator to work.
 */
export default class FilterChangeHandler extends HTMLElement {
    connectedCallback() {
        this.#addChangeListener();
    }

    #addChangeListener() {
        this.addEventListener('change', this.#handleChange.bind(this));
    }

    #handleChange() {
        console.log('filterchange');
        // We cannot use FormData here because Drupal needs more specific params.
        // TODO: Ask Jens why that is. FormData would be much more straightforward (i.e. nice).
        // const form = this.querySelector('form');
        // const formData = new FormData(form);
        // const queryString = new URLSearchParams(formData).toString();
        const params = new URLSearchParams();
        this.querySelectorAll('input[type=\'checkbox\']:checked').forEach((checkbox) => {
            params.append(checkbox.name, checkbox.value);
        });
        const textSearchField = this.querySelector('#edit-search-api-fulltext');
        if (textSearchField.value) params.append(textSearchField.name, textSearchField.value);
        this.dispatchEvent(new CustomEvent('loadContent', {
            bubbles: true,
            detail: {
                queryString: `?${params.toString()}`,
            },
        }));
        console.log('load event dispatched');
    }

    static defineCustomElement() {
        if (!customElements.get('filter-change-handler')) {
            customElements.define('filter-change-handler', FilterChangeHandler);
        }
    }
}

