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

    // nextSibling is the element below the current element in the DOM. Use the node from the
    // *previous loop* (and not just newChildren[index + 1]) as the child may be created
    // by updateNode (and will not be in newChildren)
    let nextSibling = null;

    for (let index = newChildren.length - 1; index >= 0; index--) {

        const newChild = newChildren[index];

        // Check if element is a preserved element – if it is, just return. It's already in
        // originalNode and has the correct order
        const isPreservedElement = identicalsMap.has(newChild);
        if (isPreservedElement) {
            nextSibling = identicalsMap.get(newChild);
            continue;
        }

        // Check if next sibling is a preserved element
        const preservedNextSibling = identicalsMap.get(nextSibling);


        // If next sibling is preserved: Insert before *original* element (instead of new element)
        // If next sibling is not preserved: Insert before next sibling
        // If next sibling is null: Inserts element at the very end (see insertBefore spec)
        const updatedChild = updateNode(newChild);

        const referenceNode = preservedNextSibling || nextSibling;
        originalNode.insertBefore(updatedChild, referenceNode);

        nextSibling = updatedChild;

    }

};
