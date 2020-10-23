import canReadAttributes from '../shared/canReadAttributes.js';
import InputSync from './InputSync.js';

/* global HTMLElement, document, requestAnimationFrame */
export default class FormClone extends HTMLElement {

    constructor() {
        super();
        Object.assign(
            this,
            canReadAttributes([{
                name: 'data-form-elements-selector',
                property: 'formElementsSelector',
                validate: value => !!value,
            }, {
                name: 'data-auto-submit',
                property: 'autoSubmit',
            }]),
        );
        this.readAttributes();
    }

    connectedCallback() {
        this.getInputs();
        this.renderInputs();
    }

    /**
     * Gets all elements that match data-form-element-selector and their matching labels
     * @return {array}   Objects with property input and label
     */
    getInputs() {
        const inputs = document.querySelectorAll(this.formElementsSelector);
        const inputsAndLabels = Array.from(inputs).map(input => ({
            input,
            label: document.querySelector(`[for="${input.getAttribute('id') || input.getAttribute('name')}"]`),
        }));
        this.inputs = inputsAndLabels;
    }

    /**
     * Returns property that should be synced depending on input type. For checkboxes, returns
     * 'checked', for textareas 'value'.
     */
    getInputProperty(input) {
        if (input.tagName === 'TEXTAREA') return 'value';
        if (input.tagName === 'SELECT') return 'value';
        if (input.tagName === 'INPUT') {
            const type = input.getAttribute('type');
            if (['radio', 'checkbox'].includes(type)) return 'checked';
            return 'value';
        }
        console.warn('FormSync: Cannot synchronize value of form element %o, is unknown.', input);
        return 'value';
    }

    /**
     * Takes template and renders its content for every input provided. Sets up sync between
     * original and cloned input element.
     */
    renderInputs() {
        const template = this.querySelector('template');
        // Create fragment to only modify the main DOM tree once
        const fragment = document.createDocumentFragment();
        // We must use firstElementChild as we're adding a click handler later, which will
        // not work on DocumentFragments, see
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template
        this.inputs.forEach((inputConfig) => {
            const clone = template.content.firstElementChild.cloneNode(true);
            const cloneInput = clone.querySelector('[data-input]');
            const cloneLabel = clone.querySelector('[data-label]');

            // Clone label
            if (inputConfig.label && !cloneLabel) {
                console.warn('FormSync: Label in clone missing for %o; use attribute data-label to mark the label element.', inputConfig.label.outerHTML);
            } else if (inputConfig.label && cloneLabel) {
            // We cannot clone label's innerHTML (even though that would be nice to preserve
            // formatting) as doing so would also clone inputs nested within a label.
                cloneLabel.textContent = inputConfig.label.textContent;
            }

            // Duplicate Options (for <select>)
            if (inputConfig.input.tagName === 'SELECT') {
                if (!cloneInput || cloneInput.tagName !== 'SELECT') {
                    throw new Error(`FormSync: If original element is a select, you must provide a template that contains a select with a data-input attribute; you privded ${cloneInput} instead.`);
                }
                cloneInput.innerHTML = inputConfig.input.innerHTML;
            }

            // Setup input
            if (!cloneInput) {
                console.warn('FormSync: Input in clone missing for %o; use attribute data-input to mark the input element.', inputConfig.input.outerHTML);
            } else {
                const sync = new InputSync();
                sync.setup({
                    originalElement: inputConfig.input,
                    clonedElement: cloneInput,
                    autoSubmit: !!this.autoSubmit || false,
                    property: this.getInputProperty(inputConfig.input),
                });
            }

            fragment.appendChild(clone);
        });

        // Append elements after template; template must therefore be placed at the
        // place where content will be inserted
        requestAnimationFrame(() => {
            template.parentNode.appendChild(fragment);
        });

    }

}
