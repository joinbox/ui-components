/* global requestAnimationFrame */

/**
 * Measures an element's *scroll* height or width; is needed to know how we should size its parent
 * so that it fits precisely.
 * @param {HTMLElement} element
 * @param {String} dimension - Either 'Width' or 'Height' (case matters!)
 */
export default ({ element, dimensionName = 'Height' } = {}) => {
    // In order to get the correct scrollHeight for an element that is larger than its content,
    // we must first set its height to 0 for a supershort amount of time. Supershort only works
    // if there are no (height-based) transitions on the element.
    const originalTransitionProperties = element.style.transitionProperty;
    const originalValue = element.style[dimensionName.toLowerCase()];
    // First remove the transitions; this happens instantly and affects the update of the height
    // below it (it does not transition the height).
    // eslint-disable-next-line no-param-reassign
    element.style.transitionProperty = 'none';
    // eslint-disable-next-line no-param-reassign
    element.style[dimensionName.toLowerCase()] = '0px';
    // Do the actual magic: Get the measurement.
    const size = element[`scroll${dimensionName}`];
    // Transitions are still gone: Reset the height to the original value; it includes the units.
    // eslint-disable-next-line no-param-reassign
    element.style[dimensionName.toLowerCase()] = `${originalValue}`;
    // Only re-add any potential transitions *after* the height was re-set to the original
    // value. If we skipped the delay, the height would transition from 0 to originalHeight.
    // Do *NOT* wwait it before doing further modifications; if we did, the element would
    // transition (from 0 to originalValue), the 0-value would be visible.
    requestAnimationFrame(() => {
        // eslint-disable-next-line no-param-reassign
        element.style.transitionProperty = originalTransitionProperties;
    });
    return size;
};
