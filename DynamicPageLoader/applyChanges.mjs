import findIdenticals from './findIdenticals.mjs';

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
 */
export default ({
    originalNode,
    newNode,
    canBeIdentical,
    isIdentical,
    updateNode = node => node,
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
            if (index === 0) originalNode.prepend(originalIdentical);
        }
    });


    // Go through children of newNode from back (as there is no insertAfter, just insertBefore).
    // Add children where appropriate.
    const identicalsMap = new Map(identicals);
    const newChildren = Array.from(newNode.children);
    for (let index = newChildren.length - 1; index >= 0; index--) {

        const newChild = newChildren[index];
        // Get element just before the current element
        const nextSibling = newChildren[index + 1];

        // Check if element is a preserved element – if it is, just return. It's already in
        // originalNode and has the correct order
        const isPreservedElement = identicalsMap.has(newChild);
        if (isPreservedElement) {
            continue;
        }

        // Check if next sibling is a preserved element
        const preservedNextSibling = identicalsMap.get(nextSibling);

        // If next sibling is preserved: Insert before *original* element (instead of new element)
        // If next sibling is not preserved: Insert before next sibling
        // If next sibling is undefined: Inserts element at the very end (see insertBefore spec)
        const updatedChild = updateNode(newChild);
        originalNode.insertBefore(updatedChild, preservedNextSibling || nextSibling);

    }

};
