// Make import available on window; needed for testing in JSDOM only.
import handlePopState from './handlePopState.js';

/* global window */
window.handlePopState = handlePopState;
