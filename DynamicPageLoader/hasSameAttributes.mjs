/**
 * Converts a HTML element's attributes to a Map
 * @param {HTMLElement} element
 */
const attributesToMap = (element) => {
    const { attributes } = element;
    const map = new Map();
    for (const attribute of attributes) {
        map.set(attribute.name, attribute.value);
    }
    return map;
};

/**
 * Checks if two elements use the same attributes
 */
export default (a, b) => {
    const aAttributes = attributesToMap(a);
    const bAttributes = attributesToMap(b);
    if (aAttributes.size !== bAttributes.size) return false;
    for (const [name, value] of aAttributes) {
        if (!bAttributes.has(name)) return false;
        if (bAttributes.get(name) !== value) return false;
    }
    return true;
};
