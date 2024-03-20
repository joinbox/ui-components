/* global window, document */

/**
 * Scroll to the anchor provided; browser is not taking care of it because the contents
 * of the document are replaced dynamically.
 */
export default () => {
    const { hash } = window.location;
    if (!hash) return;
    // Only select elements with ID that matches anchor; ignore outdated name attribute
    const element = document.querySelector(hash);
    if (!element) return;
    const { top } = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        || document.body.scrollTop || 0;
    // 100: Offset for menu (TODO: abstract solution for generic DPL)
    const targetYPosition = top + scrollTop - 100;
    window.scrollTo(0, targetYPosition);
};
