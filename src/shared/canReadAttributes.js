/**
 * Simplifies watching attributes; pass in a config and this mixin will automatically store
 * attribute values in a component to reduce DOM reads and simplify validation.
 * IMPORTANT: We might want to use observable attributes in the future; we did not do so now,
 * because
 * a) it's hard to add the static method to he class that consumes the mixin
 * b) there is no JSDOM support for observable attributes, which makes testing a pain
 * @param {object[]} config     Attribute config; each entry may consist of the following
 *                              properties:
 *                              - name (string, mandatory): Name of the attribute to watch
 *                              - validate (function, optional): Validation function; return a
 *                                falsy value if validation is not passed
 *                              - property (string, optional): Class property that the value
 *                                should be stored in; if not set, name will be used instead
 *                              - transform (function): Transforms value before it is saved as a
 *                                property
 */
export default (config) => {

    if (!config.every(item => item.name)) {
        throw new Error(`canReadAttribute: Every config entry must be an object with property name; you passed ${JSON.stringify(config)} instead.`);
    }

    return {
        readAttributes() {
            config.forEach((attributeConfig) => {
                const {
                    name,
                    validate,
                    property,
                    transform,
                } = attributeConfig;
                // Use getAttribute instead of dataset, as attribute is not guaranteed to start
                // with data-
                const value = this.getAttribute(name);
                if (typeof validate === 'function' && !validate(value)) {
                    throw new Error(`canWatchAttribute: Attribute ${name} does not match validation rules`);
                }
                const transformFunction = transform || (initialValue => initialValue);
                const propertyName = property || name;
                this[propertyName] = transformFunction(value);
            });
        },
    };

};
