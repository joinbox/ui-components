/* global requestAnimationFrame, HTMLElement */

/**
 * Slides an element up/down or left/right by setting its height explicitly. Only explicit heights
 * can be transitioned through CSS.
 */
var slide = ({ element, targetSize, dimension = 'y' } = {}) => {

    if (!(element instanceof HTMLElement)) {
        throw new Error(`slide: expected parameter element to be a HTMLElement, got ${element} instead.`);
    }
    if (!['x', 'y'].includes(dimension)) {
        throw new Error(`slide: expected parameter dimension to be either 'x' or 'y', got ${dimension} instead.`);
    }

    const dimensionName = dimension === 'x' ? 'Width' : 'Height';
    const initialSize = element[`offset${dimensionName}`];
    targetSize = targetSize ?? element[`scroll${dimensionName}`];
    
    requestAnimationFrame(() => {
        element.style[dimensionName.toLowerCase()] = `${initialSize}px`;
        requestAnimationFrame(() => {
            element.style[dimensionName.toLowerCase()] = `${targetSize}px`;
        });
    });

    // If element's height is set to its scrollHeight, reset numerical value to 'auto' at the
    // end of the animation (to account for upcoming window resizes etc.)
    const handleTransitionEnd = ({ target, propertyName }) => {
        if (target !== element) return;
        if (propertyName !== dimensionName.toLowerCase()) return;
        element.removeEventListener('transitionend', handleTransitionEnd);
        if (element[`offset${dimensionName}`] === element[`scroll${dimensionName}`]) {
            requestAnimationFrame(() => element.style[dimensionName.toLowerCase()] = 'auto');
        }
    };
    element.addEventListener('transitionend', handleTransitionEnd);

};

export { slide as default };
