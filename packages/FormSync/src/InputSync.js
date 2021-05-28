import submitForm from './submitForm.js';

/* global HTMLElement */

/**
 * Syncs two input elements that have a value, checked or other property (e.g. textarea, select,
 * text input) and fires a change event.
 */
export default class {

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
        autoSubmit = [],
    } = {}) {
        if (!(originalElement instanceof HTMLElement)) {
            throw new Error(`InputSync: Expected originalElement to be instance of HTMLElement, is ${originalElement} instead.`);
        }
        if (!(clonedElement instanceof HTMLElement)) {
            throw new Error(`InputSync: Expected clonedElement to be instance of HTMLElement, is ${clonedElement} instead.`);
        }
        if (!Array.isArray(autoSubmit) || !autoSubmit.every(item => typeof item === 'string')) {
            throw new Error(`InputSync: Expected autoSubmit to be an array of event names (strings), is ${autoSubmit} instead.`);
        }
        this.originalElement = originalElement;
        this.clonedElement = clonedElement;
        this.autoSubmit = autoSubmit;
        this.property = property;
        this.setupOriginalWatcher();
        this.setupClonedWatcher();
        this.syncOriginalToCloned();
        this.setupAutoSubmitWatcher();
    }

    getOriginalForm() {
        return this.originalElement.closest('form');
    }

    /**
     * Submits original form by clicking its main submit button
     */
    submitOriginalForm() {
        submitForm(this.getOriginalForm());
    }

    setupOriginalWatcher() {
        this.originalElement.addEventListener('change', () => {
            // Don't auto submit if original form changed
            this.clonedElement[this.property] = this.originalElement[this.property];
        });
    }

    setupClonedWatcher() {
        // Listen to input and change on cloned element. On original, change is enough as it is
        // not visible to the user.
        this.clonedElement.addEventListener('input', this.syncClonedElementToOriginal.bind(this));
        this.clonedElement.addEventListener('change', this.syncClonedElementToOriginal.bind(this));
    }

    /**
     * On init, sync original to cloned; also syncing backwards would not make any sense as
     * we'd sync originalElement's initial state back to originalElement.
     */
    syncOriginalToCloned() {
        this.clonedElement[this.property] = this.originalElement[this.property];
    }

    /**
     * Synchronizes data of cloned element to original element.
     */
    syncClonedElementToOriginal() {
        this.originalElement[this.property] = this.clonedElement[this.property];        
    }

    /**
     * Auto-submits original form if autoSubmit is set
     */
    setupAutoSubmitWatcher() {
        for (const eventType of this.autoSubmit) {
            this.clonedElement.addEventListener(eventType, this.submitOriginalForm.bind(this))
        }
    }

}
