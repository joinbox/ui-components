/**
 * Gets/validates attribute of a HTML element.
 * @param {HTMLElement} options.element
 * @param {name} options.name               Name of the attribute
 * @param {function} options.validate       Validate function; return true if attribute is valid
 * @param {boolean} options.isSet           True if you only want to know if the attribute is
 *                                          set (but do not care about its value).
 * @param {string} errorMessage             Additional error message
 * @return {*}                              String if isSet is false, else boolean
 */
export default ({
    element,
    name,
    validate = () => true,
    isSet = false,
    errorMessage = 'HTML attribute not valid',
} = {}) => {

    if (!name) {
        throw new Error(`getAndValidateAttribute: Pass an argument { name }; you passed ${name} instead.`);
    }
    /* global HTMLElement */
    if (!element || !(element instanceof HTMLElement)) {
        throw new Error(`getAndValidateAttribute: Pass an argument { element } that is a HTMLElement; you passed ${element} instead.`);
    }

    if (isSet) {
        const hasAttribute = element.hasAttribute(name);
        if (validate(hasAttribute) !== true) throw new Error(`getAndValidateAttribute: Attribute ${name} did not pass validation, is ${hasAttribute}: ${errorMessage}.`);
        return hasAttribute;
    }

    // Do not use dataset as it's slower
    // (https://calendar.perfplanet.com/2012/efficient-html5-data-attributes/) and provides
    // less flexibility (in case we don't want the data- prefix)
    const value = element.getAttribute(name);
    if (validate(value) !== true) throw new Error(`getAndValidateAttribute: Attribute ${name} did not pass validation, is ${value}: ${errorMessage}.`);
    return value;

};
