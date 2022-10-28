/*
- Prevent DPL with
  - clicked link element and href
  - page element target
  - page element source

- Replace element with selector on target and source
- options for isIdentical (defaults to DPL); isIdentical and canBeIdentical = one file

- Code to execute (for overlay; return false to stop?)
  - After click
  - Before load
  - After load
  - Before update
  - After update

- Links to listen (positive) or not listen to (negative selector); after default

*/


/* global document, jQuery, window */

import {
    setupDynamicPageLoader,
    links,
} from '@joinbox/dynamic-page-loader';


const enableBodyScrollLock = () => {};
const curtain = document.querySelector('.curtain');

// Remove Link
const { otherLink, ...linksForDPL } = links;
// Add link
linksForDPL.myLink = document.querySelectorAll('a');

setupDynamicPageLoader({
    clickTriggerElements: linksForDPL,
    // triggerEvents (?) – to give us full freedom? Maybe later.
    // Should we preload requests on hover?
    preloadRequest: true,
    elementsToUpdate: () => [
        (newContent) => [newContent.querySelector('head'), document.querySelector('head')],
    ],
    events: {
        // Use return false to prevent further operation? Especially on applyAttribute
        afterTriggerEvent: (element, event) => {
            enableBodyScrollLock();
            curtain.classList.add('js-page-is-changing');
        },
        beforeLoad: (url, element, event) => {
            // Remove all existing jQuery submit handlers on body that will fuck up
            // better exposed filters (auto) submits
            jQuery(document.body).off('submit');
        },
        // When do we update the URL?
        afterNavigation: (url) => {},
        afterLoad: (url, content) => {},
        beforeDOMUpdate: (oldFragment, newFragment) => {
            window.scrollTo(0, 0);
        },
        beforeAttributeUpdate: (element, attributeName, attributeValue, action) => {
            // Prevent attribute overwriting depending on element and attribute
            // Action is either add, remove or update
        },
        afterDOMUpdate: (newFragment) => {
            curtain.classList.remove('js-page-is-changing');
        },
    },
});

