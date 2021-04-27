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
     * @param {boolean} autoSubmit          Should we submit the original form when a value is
     *                                      changed in the cloned form?
     */
    setup({
        originalElement,
        clonedElement,
        property = 'checked',
        autoSubmit = false,
    } = {}) {
        if (!(originalElement instanceof HTMLElement)) {
            throw new Error(`InputSync: Expected originalElement to be instance of HTMLElement, is ${originalElement} instead.`);
        }
        if (!(clonedElement instanceof HTMLElement)) {
            throw new Error(`InputSync: Expected clonedElement to be instance of HTMLElement, is ${clonedElement} instead.`);
        }
        this.originalElement = originalElement;
        this.clonedElement = clonedElement;
        this.autoSubmit = autoSubmit;
        this.property = property;
        this.setupOriginalWatcher();
        this.setupClonedWatcher();
        this.syncOriginalToCloned();
    }

    getOriginalForm() {
        return this.originalElement.closest('form');
    }

    submitOriginalForm() {
        const form = this.getOriginalForm();
        if (!form) {
            console.warn(`InputSync: autoSubmit is true, but original element ${this.originalElement} does not have a parent that is a form.`);
            return;
        }
        // If we used form.submit(), Drupal would hard reload the form (even if AJAX was chosen
        // as the method of submitting the form). Only if we use submitButton.click() auto-submit
        // works correctly for AJAX and non-AJAX forms.
        form.querySelector('input[type="submit"]').click();
    }

    setupOriginalWatcher() {
        this.originalElement.addEventListener('change', () => {
            this.clonedElement[this.property] = this.originalElement[this.property];
            // Don't auto submit if original form changed
        });
    }

    setupClonedWatcher() {
        // Listen to input and change on cloned element. On original, change is enough as it is
        // not visible to the user.
        this.clonedElement.addEventListener('change', this.syncClonedElementToOriginal.bind(this));
        this.clonedElement.addEventListener('input', this.syncClonedElementToOriginal.bind(this));
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
        if (this.autoSubmit) this.submitOriginalForm();
    }

}
