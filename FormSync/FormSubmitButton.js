import canReadAttributes from '../shared/canReadAttributes.js';

/**
 * Lets a button that is placed outside of a form submit a form.
 */

/* global HTMLElement, document, requestAnimationFrame */
export default class FormSubmitButton extends HTMLElement {

    wasChanged = false;

    constructor() {
        super();
        Object.assign(
            this,
            canReadAttributes([{
                name: 'data-form-selector',
                property: 'formSelector',
                validate: value => !!value,
            }, {
                name: 'data-change-selector',
                property: 'changeSelector',
            }, {
                name: 'data-changed-class-name',
                property: 'changedClassName',
            }]),
        );
        this.readAttributes();
    }

    connectedCallback() {
        this.setupSubmitListeners();
        this.setupChangeListeners();
    }

    /**
     * Listens to click on submit button, calls submit() on original form
     */
    setupSubmitListeners() {
        this.addEventListener('click', this.submitForm.bind(this));
    }

    /**
     * Submits original form (defined by this.formSelector)
     */
    submitForm(ev) {
        const form = document.querySelector(this.formSelector);
        if (!form) {
            throw new Error(`FormSubmitButton: Form with selector ${this.formSelector} does not exist in document, cannot be submitted.`);
        }
        // If the FormSubmitButton is part of a form, this form should not be submitted, only the
        // original one.
        ev.preventDefault();
        ev.stopPropagation();
        form.submit();
    }

    /**
     * Listens to input/change on .this.changeSelector element
     */
    setupChangeListeners() {
        if (!this.changeSelector) return;
        const changeElement = document.querySelector(this.changeSelector);
        if (!changeElement) {
            console.warn('FormSubmitButton: Element with selector %o that should be watched for changes does not exist.', this.changeSelector);
            return;
        }
        changeElement.addEventListener('input', this.handleChangeElementChange.bind(this));
        changeElement.addEventListener('change', this.handleChangeElementChange.bind(this));
    }

    /**
     * Adds class this.changedClassName to this element when this.changeSelector is changed
     */
    handleChangeElementChange() {
        // Only modify DOM when needed; as soon as changeClassName was added, there is no need
        // to add it any more
        if (this.wasChanged) return;
        this.wasChanged = true;
        requestAnimationFrame(() => this.classList.add(this.changedClassName));
    }

}
