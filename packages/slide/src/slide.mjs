/* global requestAnimationFrame, HTMLElement */

/**
 * Slides an element up/down or left/right by setting its height explicitly. Only explicit heights
 * can be transitioned through CSS.
 */
export default ({
    element,
    targetSize,
    dimension = 'y',
    onEnd = () => {},
} = {}) => {

    if (!(element instanceof HTMLElement)) {
        throw new Error(`slide: expected parameter element to be a HTMLElement, got ${element} instead.`);
    }
    if (!['x', 'y'].includes(dimension)) {
        throw new Error(`slide: expected parameter dimension to be either 'x' or 'y', got ${dimension} instead.`);
    }

    const dimensionName = dimension === 'x' ? 'Width' : 'Height';
    const initialSize = element[`offset${dimensionName}`];
    const size = targetSize ?? element[`scroll${dimensionName}`];

    requestAnimationFrame(() => {
        /* eslint-disable no-param-reassign */
        element.style[dimensionName.toLowerCase()] = `${initialSize}px`;
        requestAnimationFrame(() => {
            element.style[dimensionName.toLowerCase()] = `${size}px`;
        });
        /* eslint-enable */
    });

    // If element's height is set to its scrollHeight, reset numerical value to 'auto' at the
    // end of the animation (to account for upcoming window resizes etc.)
    const handleTransitionEnd = ({ target, propertyName }) => {
        if (target !== element) return;
        if (propertyName !== dimensionName.toLowerCase()) return;
        element.removeEventListener('transitionend', handleTransitionEnd);
        // In earlier versions, we tested here if the new offsetHeight was equal to the
        // scrollHeight which, in some cases, did not happen; we were stuck with a fixed height,
        // the element did not adjust its size on window resize or when elements were added.
        // We now always reset the height to 'auto' at the end of the animation if no targetSize
        // was provided.
        requestAnimationFrame(() => {
            // eslint-disable-next-line no-param-reassign
            element.style[dimensionName.toLowerCase()] = 'auto';
        });
        onEnd();
    };
    element.addEventListener('transitionend', handleTransitionEnd);

};
