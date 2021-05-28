(function () {
    'use strict';

    /**
     * Simplifies watching attributes; pass in a config and this mixin will automatically store
     * attribute values in a component to reduce DOM reads and simplify validation.
     * IMPORTANT: We might want to use observable attributes in the future; we did not do so now,
     * because
     * a) it's hard to add the static method to he class that consumes the mixin
     * b) there is no JSDOM support for observable attributes, which makes testing a pain
     * @param {object[]} config     Attribute config; each entry may consist of the following
     *                              properties:
     *                              - name (string, mandatory): Name of the attribute to watch
     *                              - validate (function, optional): Validation function; return a
     *                                falsy value if validation is not passed
     *                              - property (string, optional): Class property that the value
     *                                should be stored in; if not set, name will be used instead
     *                              - transform (function): Transforms value before it is saved as a
     *                                property
     */
    var canReadAttributes = (config) => {

        if (!config.every(item => item.name)) {
            throw new Error(`canReadAttribute: Every config entry must be an object with property name; you passed ${JSON.stringify(config)} instead.`);
        }

        return {
            readAttributes() {
                config.forEach((attributeConfig) => {
                    const {
                        name,
                        validate,
                        property,
                        transform,
                    } = attributeConfig;
                    // Use getAttribute instead of dataset, as attribute is not guaranteed to start
                    // with data-
                    const value = this.getAttribute(name);
                    if (typeof validate === 'function' && !validate(value)) {
                        throw new Error(`canWatchAttribute: Attribute ${name} does not match validation rules`);
                    }
                    const transformFunction = transform || (initialValue => initialValue);
                    const propertyName = property || name;
                    this[propertyName] = transformFunction(value);
                });
            },
        };

    };

    /**
     * Adds event listener to an element and returns removeEventListener function that only needs to
     * be called to de-register an event.
     * @example
     * const disposer = createListener(window, 'click', () => {});
     */
    var createListener = (element, eventName, handler) => {
        // Takes this from execution context which must be the custom element
        element.addEventListener(eventName, handler);
        return () => element.removeEventListener(eventName, handler);
    };

    /* global HTMLFormElement */

    /**
     * Submits a form. If we use Druapl and submit the form by AJAX, Drupal will not look for a submit
     * event on the form, but only for a click event on the submit button. We therefore have to fake
     * a click on the original submit button.
     * Drupal uses input[type=submit] by default, but it may be changed to a regular
     * button[type=submit] in the template (which is easier to style); as there can only be one
     * template for all form buttons, in Drupal, we have to support buttons here, even though
     * they're invisible in the original form.
     */
    var submitForm = (form) => {

        if (!(form instanceof HTMLFormElement)) {
            throw new Error(`submitForm: Pass a valid HTMLFormElement as parameter to the function; you used ${form} instead.`);
        }

        const submitButtonSelector = 'input[type=\'submit\'], button[type=\'submit\']';
        const submitButton = form.querySelector(submitButtonSelector);
        if (!submitButton) {
            throw new Error(`submitForm: Original submit button with selector ${submitButtonSelector} could not be found in form ${form}. Form cannot be submitted.`);
        }

        // Drupal forms do not work with dispatchEvent(new Event('click', { bubbles: true }))
        // if they are submitted using AJAX. Only .click() works with Drupal forms (with and
        // without AJAX), but does not work with JSDOM.
        submitButton.click();

    };

    /**
     * Lets a button that is placed outside of a form submit a form.
     */

    /* global HTMLElement, document, requestAnimationFrame, Event */
    class FormSubmitButton extends HTMLElement {

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
            // If the FormSubmitButton is part of a form, this form should not be submitted, only the
            // original one.
            ev.preventDefault();
            ev.stopPropagation();
            const form = document.querySelector(this.formSelector);
            submitForm(form);
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

    /* global window */
    window.customElements.define('form-submit-button', FormSubmitButton);

}());
