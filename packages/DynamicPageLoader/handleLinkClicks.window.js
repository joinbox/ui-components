// Make import available on window; needed for testing in JSDOM only.
import handleLinkClicks from './handleLinkClicks.js';

/* global window */
window.handleLinks = handleLinkClicks;
