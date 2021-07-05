/**
 * Copies an attribute and its value from one element to another
 */
export default ({ sourceElement, targetElement, attribute, overwrite = true } = {}) => {
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

    targetElement.setAttribute(
        attribute,
        sourceElement.getAttribute(attribute),
    );

};
