/* global window, CustomEvent */

/**
 * Sends urlchange event when popState event occurs. Needed to harmonize URL handling between
 * forward and back navigation
 */
export default () => {

    window.addEventListener('popstate', (ev) => {
        if (!ev.state || !ev.state.url) {
            console.warn(`Event is missing state or state.url property value; event is ${JSON.stringify(ev)}`);
            return;
        }
        window.dispatchEvent(new CustomEvent('urlchange', { detail: { url: ev.state.url } }));
    });

};
