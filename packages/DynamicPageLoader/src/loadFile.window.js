// Make import available on window; needed for testing in JSDOM only.
import loadFile from './loadFile.js';

/* global window */
window.loadFile = loadFile;
