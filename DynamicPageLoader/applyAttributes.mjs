const convertAttributesToMap = (attributes) => {
    const map = new Map();
    for (const attribute of attributes) {
        map.set(attribute.name, attribute.value);
    }
    return map;
};

/**
 * Apply attributes of origin to target element
 * @param {HTMLElement} origin
 * @param {HTMLElement} target
 */
export default (origin, target) => {

    const originAttributes = convertAttributesToMap(origin.attributes);
    const targetAttributes = convertAttributesToMap(target.attributes);

    // Add/update attributes on target
    for (const [name, value] of originAttributes) {
        if (!targetAttributes.has(name)) {
            target.setAttribute(name, value);
        }
        else if (targetAttributes.get(name) !== value) {
            target.setAttribute(name, value);
        }
    }

    // Remove attributes from target
    for (const [name] of targetAttributes) {
        if (!originAttributes.has(name)) target.removeAttribute(name);
    }

};
