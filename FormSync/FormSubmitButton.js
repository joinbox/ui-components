import canReadAttributes from '../shared/canReadAttributes.js';
import createListener from '../shared/createListener.mjs';

/**
 * Lets a button that is placed outside of a form submit a form.
 */

/* global HTMLElement, document, requestAnimationFrame */
export default class FormSubmitButton extends HTMLElement {

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
        if (!this.changedClassName) return;
        const changeElement = document.querySelector(this.changeSelector);
        if (!changeElement) {
            console.warn('FormSubmitButton: Element with selector %o that should be watched for changes does not exist.', this.changeSelector);
            return;
        }
        this.removeInputListener = createListener(
            changeElement,
            'input',
            this.handleChangeElementChange.bind(this),
        );
        this.removeChangeListener = createListener(
            changeElement,
            'change',
            this.handleChangeElementChange.bind(this),
        );
    }

    /**
     * Adds class this.changedClassName to this element when this.changeSelector is changed
     */
    handleChangeElementChange() {
        // Remove listeners as soon as possible
        this.removeChangeListener();
        this.removeInputListener();
        requestAnimationFrame(() => this.classList.add(this.changedClassName));
    }

}
