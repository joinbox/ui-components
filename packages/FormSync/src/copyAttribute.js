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
