/* global window, document, jQuery, Drupal, drupalSettings */

import {
    applyChanges,
    handleLinkClicks,
    handlePopState,
    loadFile,
    createNode,
    isIdentical,
    canBeIdentical,
    applyAttributes,
} from '@joinbox/dynamicpageloader';

let resolveInAnimation;
const inAnimationPromise = new Promise((resolve) => {
    resolveInAnimation = resolve;
});


// <script> tags must be created through document.createElement and appended to DOM in order
// to be executed; we generally use innerHTML to change DOM, which does not execute script
// elements.
const updateNode = (node, externalScripts) => {
    if (node.tagName !== 'SCRIPT') return node;
    // Internal scripts
    if (!node.hasAttribute('src')) return createNode(document, node);
    // External script: Chrome will load it out of the original order –use manual loader to
    // prevent this
    const source = node.getAttribute('src');
    externalScripts.push(source);
    // We have to return *some* node. Use an empty script.
    return document.createComment(`used to be script ${source}`);
    // const clone = createNode(document, node);
    // if (!clone.hasAttribute('async')) clone.setAttribute('async', false);
    // return clone;
};


/**
 * Scroll to the anchor provided manually; browser is not taking care of it because the contents
 * of are replaced dynamically.
 */
// const scrollToAnchor = () => {
//     const { hash } = window.location;
//     if (!hash) return;
//     // Only select elements with ID that matches anchor; ignore outdated name attribute
//     const element = document.querySelector(hash);
//     if (!element) return;
//     const { top } = element.getBoundingClientRect();
//     const scrollTop = window.pageYOffset || document.documentElement.scrollTop
//         || document.body.scrollTop || 0;
//     // 100: Offset for menu (TODO: abstract solution for generic DPL)
//     const targetYPosition = top + scrollTop - 100;
//     window.scrollTo(0, targetYPosition);
// };


/**
 * Load and execute scripts one by one – this is a shitty solution (because it hurts performance
 * as scripts are not loaded in parallel) but still the best one that might be out there.
 * @param {string[]} scriptSources
 */
const dynamicallyLoadScriptsInOrder = async (scriptSources) => {
    for await (const source of scriptSources) {
        await new Promise((resolve) => {
            const script = document.createElement('script');
            // Only load next script *after* the current one has been loaded (or failed)
            script.addEventListener('load', resolve);
            script.addEventListener('error', resolve);
            script.setAttribute('src', source);
            document.body.appendChild(script);
        });
    }
};


(() => {

    // Coordinates of the event that triggered the page change; if not set, dot will animate from
    // the center, else from the target
    const pageChangeTarget = { x: null, y: null };

    // Update the initial state and add the url property. If we did not do this, navigating back
    // (browser back button) would not work, see https://github.com/joinbox/naratek/issues/153
    window.history.replaceState(
        { url: window.location.href },
        document.title,
        window.location.href,
    );

    // Do not use page transitions if it's a back office user (see
    // https://github.com/joinbox/naratek/issues/142)
    const isBackofficeUser = document.body.classList.contains('gin--horizontal-toolbar');
    if (isBackofficeUser) return;

    // Get all links
    const links = document.querySelectorAll('a:not([target="_blank"])');


    const baseUrl = `${window.location.protocol}//${window.location.hostname}`;
    const isDPLLink = (link, element) => {
        if (element.matches('[data-ignore-dpl]')) return false;
        // Ignore all external links
        return link.startsWith('/') || link.startsWith(baseUrl);
    };

    // Get click position; we need a dirty workaround here because DPL does not provide us with
    // the corresponding data. This event listener must be added *before* handleLinkClicks or
    // the x/y positions won't be available when handleLinkClicks is executed
    for (const link of links) {
        link.addEventListener('click', (event) => {
            // Use same validation function as DPL
            const { currentTarget } = event;
            if (!isDPLLink(currentTarget?.getAttribute('href'), currentTarget)) return;
            pageChangeTarget.x = event.pageX;
            pageChangeTarget.y = event.pageY;
            // Reset after a short amount because the page change will then have been trigggered
            // by something different than this click
            setTimeout(() => {
                pageChangeTarget.x = null;
                pageChangeTarget.y = null;
            }, 100);
        });
    }

    handleLinkClicks({
        linkElements: links,
        checkLink: isDPLLink,
    });
    handlePopState();

    window.addEventListener(
        'urlchange',
        async (ev) => {

            // If user switched page through the menu on mobile, the body scroll lock may still be
            // active after a dynamic page change; remove it (or the user won't be able to scroll).
            // enableBodyScroll needs a target which is only present before we apply the changes;
            // therefore we enable the scroll before applying the changes.
            const scrollLockTarget = document.querySelector('[data-mobile-menu-scroll-lock]');
            if (scrollLockTarget) scrollLockTarget.enableScroll();
            // Scroll only works after clicking the body; focus it to prevent this unexpected
            // behavior; use timeout to account for the rAF in disableScrollLock
            setTimeout(() => document.body.click(), 100);

            const { url } = ev.detail;

            document.body.classList.add('is-transitioning');
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolveInAnimation();
                    resolve();
                }, 800);
            });

            // Await entry transition as well as new data
            const dom = await loadFile(url);

            const externalScripts = [];
            try {
                // Remove all existing jQuery submit handlers on body that will fuck up
                // better exposed filters (auto) submits
                jQuery(document.body).off('submit');
            } catch (err) {
                console.error(err);
            }

            // Make sure everything's blue
            await inAnimationPromise;

            // Update head first (is above body in DOM)
            applyChanges({
                originalNode: document.querySelector('head'),
                newNode: dom.querySelector('head'),
                canBeIdentical,
                isIdentical,
                updateNode: (node) => updateNode(node, externalScripts),
                updateAttributes: applyAttributes,
            });

            document.body.classList.remove('is-transitioning');
            // Remove attribute set by once that would prevent Joinimation from working
            document.body.removeAttribute('data-initialized-joinimation');

            applyChanges({
                // We must update the children of body in order for new scripts to be executed.
                // Therefore, curtain (that is preserved) must be a child of body.
                originalNode: document.querySelector('body'),
                newNode: dom.querySelector('body'),
                canBeIdentical,
                isIdentical,
                updateNode: (node) => updateNode(node, externalScripts),
                updateAttributes: (origin, target) => {
                    applyAttributes(origin, target);
                },
            });

            document.body.classList.remove('is-transitioning');

            // Scroll to top of page
            window.scrollTo(0, 0, { behavior: 'auto' });

            scrollToAnchor();

            await dynamicallyLoadScriptsInOrder(externalScripts)

            // Attach behaviors manually – could we also do that by emitting a
            // DOMContentLoaded event? Maybe not as it will only be watched for if
            // readyState is not 'loading'.
            Drupal.attachBehaviors(document, drupalSettings);

            // Fuck that GSAP shit: ScrollTrigger measures the DOM at the worst of all possible
            // moment and fucks everything up. Give it some slack – and re-init the relevant
            // components with some arbitrary delay
            // Heureka: The problem **might** be that we don't unregister custom elements; when
            // the elements are placed in the DOM, the custom element from the previous page is
            // still available – and executed instantly. Maybe the trouble isn't with GSAP after
            // all. Maybe.
            const elementsThatGSAPMessesUp = document.querySelectorAll('helga-reference-list, helga-competence-fan, helga-reference-preview');
            [...elementsThatGSAPMessesUp].forEach((messedUpElement) => {
                messedUpElement.kill();
                messedUpElement.setup();
            });

        },

        // Note once here which is crucial; window will persist over all page changes. If we add
        // the urlchange handler every time, it will fire many times after many page reloads.
        { once: true },
    );
})();
