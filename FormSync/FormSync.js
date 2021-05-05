import canReadAttributes from '../shared/canReadAttributes.js';
import InputSync from './InputSync.js';

/* global HTMLElement, document, requestAnimationFrame */
export default class FormSync extends HTMLElement {

    /**
     * @type {{input: HTMLElement, label: HTMLElement}[]}
     */
    inputs = [];

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
        this.setupInputSync();
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
            // IE11 and its polyfill have issues with template.content (it is empty); use fallback
            // for IE11 by cloning the template itself, not its content.
            const clone = template.content ?
                template.content.firstElementChild.cloneNode(true) :
                template.cloneNode(true).firstElementChild;
            const cloneInput = clone.querySelector('[data-input]');
            const cloneLabel = clone.querySelector('[data-label]');

            this.copyLabel(inputConfig.label, cloneLabel);
            this.copySelectOptions(inputConfig.input, cloneInput);
            this.syncInput(inputConfig.input, cloneInput);
            this.copyPlaceholder(inputConfig.input, cloneInput);
            this.connectLabelToInput(cloneLabel, cloneInput);

            fragment.appendChild(clone);
        });

        // Append elements after template; template must therefore be placed at the
        // place where content will be inserted
        requestAnimationFrame(() => {
            template.parentNode.appendChild(fragment);
        });

    }

    /**
     * Connects a label to an input through for and id attributes. Does not modify pre-existing
     * values.
     * @param {HTMLElement} label
     * @param {HTMLElement} input
     */
    connectLabelToInput(label, input) {
        if (!label || !input) return;
        // Don't modify existing for attribute
        if (label.hasAttribute('for')) return;
        // Create id on input and for on label. We may not clone inputConfig.input's id
        // as an ID must be unique per document. Use id of cloneInput if present.
        const inputId = input.getAttribute('id') ||
            `input-id-${Math.random().toString().replace('.', '')}`;
        // Replace id with new or pre-existing id to simplify things
        input.setAttribute('id', inputId);
        label.setAttribute('for', inputId);
    }

    /**
     * Copies textContent of original to cloned label
     * @param {HTMLElement} originalLabel
     * @param {HTMLElement} clonedLabel
     */
    copyLabel(originalLabel, clonedLabel) {
        if (originalLabel && !clonedLabel) {
            console.warn('FormSync: Label in clone missing for %o; use attribute data-label to mark the label element.', originalLabel.outerHTML);
        } else if (originalLabel && clonedLabel) {
            // We cannot clone label's innerHTML (even though that would be nice to preserve
            // formatting) as doing so would also clone inputs nested within a label.
            clonedLabel.textContent = originalLabel.textContent;
        }
    }

    /**
     * Clones placeholder attribute from original to cloned input if needed
     * @param {HTMLElement} originalInput
     * @param {HTMLElement} clonedInput
     */
    copyPlaceholder(originalInput, clonedInput) {
        if (
            originalInput &&
            clonedInput &&
            originalInput.hasAttribute('placeholder') &&
            !clonedInput.hasAttribute('placeholder')
        ) {
            clonedInput.setAttribute(
                'placeholder',
                originalInput.getAttribute('placeholder'),
            );
        }
    }

    /**
     * Copies options of original to cloned <select> input
     * @param {HTMLElement} originalInput
     * @param {HTMLElement} clonedInput
     */
    copySelectOptions(originalInput, clonedInput) {
        if (originalInput.tagName === 'SELECT') {
            if (!clonedInput || clonedInput.tagName !== 'SELECT') {
                throw new Error(`FormSync: If original element is a select, you must provide a template that contains a select with a data-input attribute; you privded ${clonedInput.outerHTML} instead.`);
            }
            clonedInput.innerHTML = originalInput.innerHTML;
        }
    }

    /**
     * Multiple original radio button sets might be linked to one single cloned radio button set.
     * When **one** cloned radio button is changed, we might therefore have to change multiple
     * original radio inputs. Do so by syncing the whole form. 
     * TODO: Find a better solution.
     */
    setupInputSync() {
        // As this workaround is only relevant for radio buttons, we need only to listen to the
        // change event on radio inputs.
        this.addEventListener('change', (ev) => {
            if (!ev.target.matches('input[type="radio"]')) return;
            this.syncSimilarRadIonputs(ev.target);
        });
    }

    syncSimilarRadIonputs(radioInput) {
        // Get all radio inputs with the same name attribute
        const name = radioInput.getAttribute('name');
        const similarClonedInputs = this.querySelectorAll(`input[type="radio"][name="${name}"]`);
        // Call
        Array.from(similarClonedInputs).forEach((input) => {
            const sync = input.inputSync;
            if (!sync) {
                console.warn('FormSync: Could not find InputSync instance on radio input %o', radioInput);
                return;
            }
            input.inputSync.syncClonedElementToOriginal();
        });

    }

    /**
     * Sets up InputSync for input elements
     * @param {HTMLElement} originalInput
     * @param {HTMLElement} clonedInput
     */
    syncInput(originalInput, clonedInput) {
        if (!clonedInput) {
            console.warn('FormSync: Input in clone missing for %o; use attribute data-input to mark the input element.', originalInput.outerHTML);
            return;
        }
        const sync = new InputSync();
        sync.setup({
            originalElement: originalInput,
            clonedElement: clonedInput,
            autoSubmit: !!this.autoSubmit || false,
            property: this.getInputProperty(originalInput),
        });
        // Store sync instance on element to update it later (see radio workaround above)
        clonedInput.inputSync = sync;
    }

}
