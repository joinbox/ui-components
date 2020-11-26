/* global requestAnimationFrame */
export default (element, dimension = 'height') => {
    if (!['height', 'width'].includes(dimension)) {
        throw new Error(`fixDimension: Either pass 'height' or 'width' as value for dimension; you used ${dimension} instead.`);
    }
    if (!(element instanceof HTMLElement)) {
        throw new Error(`fixDimension: Provide an instance of HTMLElement as element argument, you used ${element} instead.`);
    }
    const dimensionValue = element.getBoundingClientRect()[dimension];
    const axis = dimension === 'height' ? 'X' : 'Y';
    requestAnimationFrame(() => {
        element.style[`overflow${axis}`] = 'hidden';
        element.style[dimension] = `${dimensionValue}px`;
    });
};
