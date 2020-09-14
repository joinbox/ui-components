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

    // Insert updated nodes in their order one by one into the DOM. When an element is preserved,
    // use the original instead of the updated element.
    const preservedMapping = new Map(identicals);
    Array.from(newNode.children).forEach((element) => {
        const elementToAppend = preservedMapping.get(element) || element;

        // Hook to modify node; only called if element is not preserved
        const updatedElementToAppend = !preservedMapping.has(element) ?
            updateNode(elementToAppend) : elementToAppend;

        // Try not to place link at a different position; removing from and adding it to DOM will
        // cause a flicker
        // TODO: Use a proper solution (only use appendChild if sort order changed)
        if (element.tagName.toLowerCase() === 'link' && preservedMapping.has(element)) {
            return;
        }

        originalNode.append(updatedElementToAppend);

    });

};
