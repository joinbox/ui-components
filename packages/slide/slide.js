/* global requestAnimationFrame, HTMLElement */

/**
 * Slides an element up/down or left/right by setting its height explicitly. Only explicit heights
 * can be transitioned through CSS.
 */
var slide = ({
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
    let size;
    if (targetSize !== undefined) size = targetSize;
    else {
        // If the new content is smaller than the current one, we cannot use offsetHeight or
        // scrollHeight as both would return the dimensions of the (larger) old content – slide
        // would never shrink. We therefore have to set its height to 0 for a supershort amount
        // of time.
        // eslint-disable-next-line no-param-reassign
        element.style.height = 0;
        size = element[`scroll${dimensionName}`];
    }

    // Don't use requestAnimationFrame here to minimize the amount of time we spend with a
    // height of 0 (if targetSize was not provided and we set it to 0 to measure the scrollHeight)
    // correctly.
    // eslint-disable-next-line no-param-reassign
    element.style[dimensionName.toLowerCase()] = `${initialSize}px`;
    // We *must* use requestAnimationFrame here: Switching from 0 to size within no time would not
    // execute the transition.
    requestAnimationFrame(() => {
        // eslint-disable-next-line no-param-reassign
        element.style[dimensionName.toLowerCase()] = `${size}px`;
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
        if (targetSize === undefined) {
            requestAnimationFrame(() => {
                // eslint-disable-next-line no-param-reassign
                element.style[dimensionName.toLowerCase()] = 'auto';
            });
        }
        onEnd();
    };
    element.addEventListener('transitionend', handleTransitionEnd);

};

export { slide as default };
