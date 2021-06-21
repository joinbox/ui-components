import FormSubmitButton from './FormSubmitButton.js';

/* global window */
if (!window.customElements.get('form-submit-button')) {
    window.customElements.define('form-submit-button', FormSubmitButton);
}
