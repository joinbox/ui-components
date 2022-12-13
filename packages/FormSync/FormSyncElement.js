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
     * Simple debounce implementation. Use:
     * import { createDebounce } from '@joinbox/ui-components;
     * const debounce = createDebounce();
     * debounce(() => {}), 500);
    */
    var createDebounce = () => {
        let timeout;
        return (callback, offset) => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(callback, offset);
        };
    };

    /* global HTMLElement */

    /**
     * Syncs two input elements that have a value, checked or other property (e.g. textarea, select,
     * text input) and fires a change event.
     */
    class InputSync {

        /**
         * Sets up watcher
         * @param {HTMLElement} originalElement Element to sync changes from and to. This is, where the
         *                                      original form is.
         * @param {HTMLElement} clonedElement   Element to sync changes from and to
         * @param {string} property             Property to watch (e.g. 'value', 'checked')
         * @param {string[]} autoSubmit         If original form should be submitted when the input
                                                value changes: Provide all events that, if fired
                                                on the input, cause a submit on the original form.
         */
        setup({
            originalElement,
            clonedElement,
            property = 'checked',
            clonedProperty = 'checked',
            autoSubmit = [],
            submitOnEnter = false,
        } = {}) {
            if (!(originalElement instanceof HTMLElement)) {
                throw new Error(`InputSync: Expected originalElement to be instance of HTMLElement, is ${originalElement} instead.`);
            }
            if (!(clonedElement instanceof HTMLElement)) {
                throw new Error(`InputSync: Expected clonedElement to be instance of HTMLElement, is ${clonedElement} instead.`);
            }
            if (!Array.isArray(autoSubmit) || !autoSubmit.every(item => typeof item === 'object')) {
                throw new Error(`InputSync: Expected autoSubmit to be an array of event names (strings), is ${autoSubmit} instead.`);
            }
            this.originalElement = originalElement;
            this.clonedElement = clonedElement;
            this.autoSubmit = autoSubmit;
            this.submitOnEnter = submitOnEnter;
            this.property = property;
            this.clonedProperty = clonedProperty;
            this.setupOriginalWatcher();
            this.setupClonedWatcher();
            this.syncOriginalToCloned();
            this.setupAutoSubmitWatcher();
            this.setupEnterWatcher();
        }

        getOriginalForm() {
            return this.originalElement.closest('form');
        }

        /**
         * Submits original form by clicking its main submit button
         */
        submitOriginalForm() {
            // Only submit form if input is valid; is needed to e.g. not submit a form on a date
            // input that reads 0002-01-01 (which is what happens when user enters 01012); to prevent
            // it, use e.g. min="2021-05-31"; the form will only be submitted if the value entered
            // is in the future.
            if (!this.clonedElement.checkValidity()) return;
            submitForm(this.getOriginalForm());
        }

        setupOriginalWatcher() {
            this.originalElement.addEventListener('change', () => {
                // Don't auto submit if original form changed
                this.clonedElement[this.clonedProperty] = this.originalElement[this.property];
            });
        }

        setupClonedWatcher() {
            // Listen to input and change on cloned element. On original, change is enough as it is
            // not visible to the user.
            this.clonedElement.addEventListener('input', this.syncClonedElementToOriginal.bind(this));
            this.clonedElement.addEventListener('change', this.syncClonedElementToOriginal.bind(this));
        }

        setupEnterWatcher() {
            if (!this.submitOnEnter) return;
            this.clonedElement.addEventListener('keyup', (ev) => {
                if (ev.key === 'Enter') this.submitOriginalForm();
            });
        }

        /**
         * On init, sync original to cloned; also syncing backwards would not make any sense as
         * we'd sync originalElement's initial state back to originalElement.
         */
        syncOriginalToCloned() {
            this.clonedElement[this.clonedProperty] = this.originalElement[this.property];
        }

        /**
         * Synchronizes data of cloned element to original element.
         */
        syncClonedElementToOriginal() {
            this.originalElement[this.property] = this.clonedElement[this.clonedProperty];
        }

        /**
         * Auto-submits original form if autoSubmit is set
         */
        setupAutoSubmitWatcher() {
            for (const { eventName, debounceTime } of this.autoSubmit) {
                let submitHandler = this.submitOriginalForm.bind(this);
                if (debounceTime) {
                    const debounce = createDebounce();
                    submitHandler = debounce.bind(
                        null,
                        this.submitOriginalForm.bind(this),
                        debounceTime,
                    );
                }
                this.clonedElement.addEventListener(eventName, submitHandler);
            }
        }

    }

    /**
     * Copies an attribute and its value from one element to another
     */
    var copyAttribute = ({ sourceElement, targetElement, attribute, overwrite = true } = {}) => {
        /* global HTMLElement */
        if (!(sourceElement instanceof HTMLElement)) {
            throw new Error(`copyAttribute: sourceElement must be a HTMLElement, is ${sourceElement} instead.`)
        }
        if (!(targetElement instanceof HTMLElement)) {
            throw new Error(`copyAttribute: sourceElement must be a HTMLElement, is ${targetElement} instead.`)
        }
        if (typeof attribute !== 'string') {
            throw new Error(`copyAttribute: attribute must be a string, is ${attribute} instead.`)
        }

        // Don't overwrite existing attribute if overwrite is false
        if (!overwrite && targetElement.hasAttribute(attribute)) return;

        // Make sure we don't copy attributes that are non-existent on source; for boolean attributes
        // (e.g. disabled) this would lead to the attribute being added to target
        // (as e.g. disabled="null") while it is not present on the source
        // At the same time, we will not remove attributes on target if missing on source, as a
        // developer might e.g. want to add certain classes on target while there's no need for a
        // class attribute on the source.
        if (!sourceElement.hasAttribute(attribute)) return;

        targetElement.setAttribute(
            attribute,
            sourceElement.getAttribute(attribute),
        );

    };

    /* global HTMLElement, document, requestAnimationFrame */
    class FormSync extends HTMLElement {

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
                    // Split string at comma and only use valid (non-empty) values
                    transform: value => (!value ? [] : value
                        .split(/\s*,\s*/)
                        // Remove empty items
                        .filter(item => !!item)
                        // Get eventName and debounceTime; split at : with white spaces
                        .map(item => item.split(/\s*:\s*/))
                        .map(([eventName, debounceTime]) => ({
                            eventName,
                            ...(debounceTime ? { debounceTime: parseFloat(debounceTime) } : {}),
                        }))
                    ),
                }, {
                    name: 'data-submit-on-enter',
                    property: 'submitOnEnter',
                    transform: value => (value === null || value === undefined) ? false : true,
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
            if (input.tagName === 'OPTION') return 'selected';
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
                this.copySelectOptionLabel(inputConfig.input, cloneLabel);
                this.syncInput(inputConfig.input, cloneInput);
                this.copyPlaceholder(inputConfig.input, cloneInput);
                this.copyDisabled(inputConfig.input, cloneInput);
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
            if (!originalInput || !clonedInput) return;
            copyAttribute({
                sourceElement: originalInput,
                targetElement: clonedInput,
                attribute: 'placeholder',
                overwrite: false,
            });
        }

        /**
         * Clones disabled attribute from original to cloned input. If it is already set on cloned
         * input, let's assume this was done on purpose and don't overwrite it.
         * @param {HTMLElement} originalInput
         * @param {HTMLElement} clonedInput
         */
        copyDisabled(originalInput, clonedInput) {
            if (!originalInput || !clonedInput) return;
            copyAttribute({
                sourceElement: originalInput,
                targetElement: clonedInput,
                attribute: 'disabled',
                overwrite: false,
            });
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
         * Copies text of a select option to the cloned input
         * @param {HTMLElement} originalInput
         * @param {HTMLElement} clonedInput
         */
        copySelectOptionLabel(originalInput, clonedInput) {
            if (originalInput.tagName === 'OPTION') {
                if (!clonedInput || clonedInput.tagName === 'OPTION') {
                    throw new Error(`FormSync: If original element is a select, you must provide a template that contains a select with a data-input attribute; you privded ${clonedInput.outerHTML} instead.`);
                }
                clonedInput.innerText = originalInput.innerText;
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
                this.syncSimilarRadioInputs(ev.target);
            });
        }

        /**
         * See comment at this.setupInputSync()
         */
        syncSimilarRadioInputs(radioInput) {
            // Get all radio inputs with the same name attribute
            const name = radioInput.getAttribute('name');
            const similarClonedInputs = this.querySelectorAll(`input[type="radio"][name="${name}"]`);
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

            const isSelectOptionClonedToInput = originalInput.tagName === 'OPTION' && originalInput.tagName !== clonedInput.tagName;
            const property = this.getInputProperty(originalInput);

            sync.setup({
                originalElement: originalInput,
                clonedElement: clonedInput,
                autoSubmit: this.autoSubmit,
                property: property,
                clonedProperty: isSelectOptionClonedToInput ? this.getInputProperty(clonedInput) : property,
                submitOnEnter: this.submitOnEnter,
            });
            // Store sync instance on element to update it later (see radio workaround above)
            clonedInput.inputSync = sync;
        }

    }

    /* global window */
    if (!window.customElements.get('form-sync')) {
        window.customElements.define('form-sync', FormSync);
    }

})();
