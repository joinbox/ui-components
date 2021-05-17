import hasSameAttributes from './hasSameAttributes.mjs';

/**
 * Default implementation for canBeIdentical
 */
export default (a, b) => {

    // Simple elements that are considered identical if they have the same attributes. Do not
    // add script as scripts need to be changed (and therefore executed) on each page load.
    const validWithIdenticalAttributes = [
        'link',
        'meta',
    ];
    const isSameElementType = a.tagName === b.tagName;
    // Only test for tagName of a, as a's tagName is the same as b's tagName
    const elementIsValidWithIdenticalAttributes = validWithIdenticalAttributes
        .includes(a.tagName.toLowerCase());
    const isIdenticalDueToAttributes = elementIsValidWithIdenticalAttributes &&
        hasSameAttributes(a, b);
    if (isIdenticalDueToAttributes && isSameElementType) {
        return true;
    }

    if (a.hasAttribute('data-preserve-id') && b.hasAttribute('data-preserve-id') &&
        a.getAttribute('data-preserve-id') === b.getAttribute('data-preserve-id')
    ) {
        return true;
    }

    return false;

};
