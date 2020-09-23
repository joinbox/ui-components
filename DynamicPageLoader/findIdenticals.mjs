
/**
 * Finds an element in children that is identical to element according to isIdentical
 */
const findIdentical = (element, children, isIdentical) => (
    Array.from(children).find(child => isIdentical(element, child))
);

/**
 * Returns identical elements of two nodes in the order they appear in *newNode*.
 * Uses two functions to determine identity:
 * - canBeIdentical (for performance optimization)
 * - findIdentical
 * @param {HTMLElement} originalNode     Node that will be replaced with content of newNode
 * @param {HTMLElement} newNode
 * @param {function} canBeIdentical      Function that takes a HTMLElement and returns true if
 *                                       it *might* be identical; used for performance optimization
 * @param {function} isIdentical         Function that takes two HTMLElements and returns true
 *                                       if they are considered identical
 * @returns Array.<HTMLElement, HTMLElement>[]  Array with one entry per identical; entry consists
 *                                              of an array with update and original element
 */
export default ({
    originalNode,
    newNode,
    canBeIdentical,
    isIdentical,
}) => {
    // Get all children of newNode that *might* be identials. Just used to improve performance
    // so that we do not have to test all elements
    const possibleNewNodeIdenticals = Array.from(newNode.children).filter(child => (
        canBeIdentical(child)
    ));
    const originalChildren = originalNode.children;
    const identicals = possibleNewNodeIdenticals
        .map(element => [element, findIdentical(element, originalChildren, isIdentical)])
        // Remove all entries that do not contain an identical element
        .filter(row => !!row[1]);
    return identicals;
};
