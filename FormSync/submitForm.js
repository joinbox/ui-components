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
export default (form) => {

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
