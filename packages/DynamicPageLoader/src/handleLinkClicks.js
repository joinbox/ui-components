import once from './once.mjs';

/* global window, CustomEvent */


const updateState = (url) => {
    // Update state; does not have any direct effect, but is needed if user reloads or navigates
    // back
    window.history.pushState({ url }, '', url);
    // Fire urlchange event; same will be done with popstate to harmonize url change behavior
    window.dispatchEvent(new CustomEvent('urlchange', { detail: { url } }));
};


const handleLinkClick = checkLink => (ev) => {
    const href = ev.currentTarget.getAttribute('href');
    // Don't handle link if filterLinks returns falsy value for the given url
    if (checkLink && typeof checkLink === 'function' && !checkLink(href)) return;
    ev.preventDefault();
    updateState(href);
};


/**
 * Sends urlchange event when a link click occurs. Needed to harmonize URL handling between
 * forward and back (popstate) navigation
 */
export default ({
    linkElements,
    checkLink,
}) => {

    for (const element of linkElements) {
        // handleLinkClicks might be called multiple times (whenever the DOM content is replaced
        // with the content of a new page), we must ensure that the link handler is only
        // added once (for elements that are preserved over a page change)
        once(element, 'click-handler-added', () => {
            element.addEventListener('click', handleLinkClick(checkLink));
        });
    }

};

