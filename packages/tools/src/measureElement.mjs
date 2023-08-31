import { debounce } from '../main.mjs';

/**
 * Measures an element's dimensions initially, on resize and visibility change; stores values
 * in an object so that dimensions can be accessed anywhere the object is used and are always 
 * up to date (because we only update the referenced values within the object once they change)
 * @param {Object} options
 * @param {HTMLElement} options.element
 * @param {Boolean} options.updateOnIntersection
 * @returns {Object}
 */
export default ({ element, updateOnIntersection = false } = {}) => {

    const dimensions = {};

    const measure = () => {
        // Only update the object's properties; if we modify the object itself, the references
        // to it will break.
        const newDimensions = element.getBoundingClientRect();
        // See https://stackoverflow.com/questions/39417566/how-best-to-convert-a-clientrect-domrect-into-a-plain-object
        const keys = Object.keys(DOMRectReadOnly.prototype);
        [...keys].forEach((key) => dimensions[key] = newDimensions[key]);
    }

    measure();

    // Wait for images to be loaded (they may shift an object's position); only works if images
    // are not lazy loaded; remove the listener after it fired once
    window.addEventListener('load', measure, { once: true });

    // Update dimensions on resize (after debounce) as the element most probably is responsive
    // and changes its dimensions with the viewport
    const debouncedMeasure = debounce(measure, 50);
    window.addEventListener('resize', debouncedMeasure);

    // Update element whenever it comes into the viewport; if the element contains an image
    // without fixed height/width or its position (x/y) depends on an image above, the
    // dimensions may only be resolved once the images are loaded
    if (updateOnIntersection) {
        const observer = new IntersectionObserver(measure);
        observer.observe();
    }

    return dimensions;

}
