/**
 * Adds event listener to an element and returns removeEventListener function that only needs to
 * be called to de-register an event.
 * @example
 * const disposer = createListener(window, 'click', () => {});
 */
export default (element, eventName, handler) => {
    // Takes this from execution context which must be the custom element
    element.addEventListener(eventName, handler);
    return () => element.removeEventListener(eventName, handler);
};
