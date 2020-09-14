/**
 * Creates a new DOM element from the one passed in, including all its attributes. Reason: Script
 * elements are not executed when added to DOM via innerHTML; they must be manually created
 * (via createElement) and appended to the parent element.
 * @param {HTMLElement} originalNode
 * @param {Document} document           Reference to document in whose scope the element should
 *                                      be created. Passed in to use another document than the
 *                                      current one and to simplify testing.
 */
export default (document, originalNode) => {
    const newNode = document.createElement(originalNode.tagName);
    for (const attribute of originalNode.attributes) {
        newNode.setAttribute(attribute.name, attribute.value);
    }
    return newNode;
};
