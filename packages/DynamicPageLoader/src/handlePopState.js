/* global window, CustomEvent */

/**
 * Sends urlchange event when popState event occurs. Needed to harmonize URL handling between
 * forward and back navigation
 */
export default () => {

    window.addEventListener('popstate', (ev) => {
        window.dispatchEvent(new CustomEvent('urlchange', { detail: { url: ev.state.url } }));
    });

};
