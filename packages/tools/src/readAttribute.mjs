/**
 * Reads, transforms and validates an attribute from an HTML element.
 */
export default (
    element,
    attributeName,
    {
        transform = (value) => value,
        validate = () => true,
        expectation = '(expectation not provided)',
    } = {},
) => {
    const value = element.getAttribute(attributeName);
    const transformedValue = transform(value);
    if (!validate(transformedValue)) {
        throw new Error(`Expected attribute ${attributeName} of element ${element.outerHTML} to be ${expectation}; got ${transformedValue} instead (${value} before the transform function was applied).`);
    }
    return transformedValue;
};
