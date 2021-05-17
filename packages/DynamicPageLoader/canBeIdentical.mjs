/**
 * Default implementation for canBeIdentical
 */
export default (element) => {

    // Simple elements that are considered identical if they have the same attributes. Do not
    // add script as scripts need to be changed (and therefore executed) on each page load.
    const validWithIdenticalAttributes = [
        'link',
        'meta',
    ];
    if (validWithIdenticalAttributes.includes(element.tagName.toLowerCase())) return true;

    // Element with data-preserve-id
    return element.hasAttribute('data-preserve-id');

}