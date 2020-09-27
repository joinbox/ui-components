import findIdenticals from './findIdenticals.mjs';


// Returns the next preserved element (original) after element
const getNextPreservedElement = (preservedElements, element) => {
    // First loop: element is null. Return first element or null
    if (element === null) return (preservedElements.length && preservedElements[0][1]) || null;
    const currentIndex = preservedElements.findIndex(item => item[1] === element);
    // element was the last element in preservedElements
    if (currentIndex === preservedElements.length - 1) return null;
    // Get origin of next preserved element
    return preservedElements[currentIndex + 1][1];
};



/**
 * Compares two nodes' children, then updates originalNode to match newNode. Preserves the children
 * that are not changed, adds new ones and removes old ones.
 * @param {HTMLElement} originalNode      Original node that will be updated/changed
 * @param {HTMLElement} newNode
 * @param {function} canBeIdentical       See findIdenticals
 * @param {function} isIdentical          See findIdenticals
 * @param {function} updateNode           Function that is called with every new (not preserved)
 *                                        node; returns the (re-formatted) node. Used to e.g. create
 *                                        script tags through document.createElement.
 * @param {function} updateAttributes     Function that is called with every preserved element;
 *                                        attributes passed are (newElement, originalElement).
 *                                        Modify original element if you want to clone attributes
 *                                        from new to original element.
 */
export default ({
    originalNode,
    newNode,
    canBeIdentical,
    isIdentical,
    updateNode = node => node,
    updateAttributes = () => {},
}) => {

    const identicals = findIdenticals({
        originalNode,
        newNode,
        canBeIdentical,
        isIdentical,
    });

    // Remove everything from original that is not preserved
    const originalIdenticals = identicals.map(([, original]) => original);
    Array.from(originalNode.children).forEach((child) => {
        if (!originalIdenticals.includes(child)) originalNode.removeChild(child);
    });

    // Update order of *preserved* elements, but only if needed. Changing the order of e.g.
    // link elements (with style definitions) causes flickering.
    // identicals has the sort order of the elements in newNode; check if the elements are at the
    // expected position in originalNode and update position only if needed.
    identicals.forEach(([, originalIdentical], index) => {
        if (originalNode.children[index] !== originalIdentical) {
            // Get node before which we will insert the current node. insertBefore(x, null) will
            // insert x at the end.
            const referenceNode = originalNode.children[index + 1] || null;
            originalNode.insertBefore(originalIdentical, referenceNode);
        }
    });


    // Go through children of newNode from back (as there is no insertAfter, just insertBefore).
    // Add children where appropriate.
    const identicalsMap = new Map(identicals);
    const newChildren = Array.from(newNode.children);

    // nextSibling is the element below the current element in the DOM. Use first identical 
    // (original) or null if not set. Use null as insertBefore(element, null) inserts element at
    // the end of the parent.
    let nextSibling = getNextPreservedElement(identicals, null);

    // Go through newChildren in the correct order; we used to start at the bottom which leads
    // to issues with e.g. the order of scripts
    for (const newChild of newChildren) {

        // Check if element is a preserved element – if it is, apply attributes and return. It's
        // already in originalNode and has the correct order
        const isPreservedElement = identicalsMap.has(newChild);
        if (isPreservedElement) {
            // Update attributes of preserved element
            updateAttributes(newChild, identicalsMap.get(newChild));
            nextSibling = getNextPreservedElement(identicals, nextSibling);
            continue;
        }

        const updatedChild = updateNode(newChild);
        originalNode.insertBefore(updatedChild, nextSibling);

    }

};
