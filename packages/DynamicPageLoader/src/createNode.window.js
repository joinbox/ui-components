// Make import available on window; needed for testing in JSDOM only.
import createNode from './createNode.js';

/* global window */
window.createNode = createNode;
