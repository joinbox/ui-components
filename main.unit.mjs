// Testing exports is hard: Node requires .mjs, ava fails with { type: "module" } in package.json
// and babel for browsers only accepts js file endings, Node 13 does not know require any more.
// Wow. Leave it for now.
// TODO: Write JSDOM based tests as soon as YouTube is a web component
import test from 'ava';

test.todo('test exports in main.js');


/* const test = require('ava');
const {
    YouTubePlayer,
    Overlay,
    OverlayButton,
} = require('./main.mjs');

test('exports all components', (t) => {
    t.is(typeof YouTubePlayer, 'function');
    t.is(typeof Overlay, 'object');
    t.is(typeof OverlayButton, 'object');
});
*/
