import jsdom from 'jsdom';
import test from 'ava';
import createListener from './createListener.js';

const { JSDOM } = jsdom;

test('adds listener', async (t) => {
    const dom = new JSDOM('<div></div>');
    const div = dom.window.document.querySelector('div')
    let counter = 0;
    const remove = createListener(div, 'click', () => counter++);
    t.is(typeof remove, 'function');
    div.dispatchEvent(new dom.window.CustomEvent('click'));
    t.is(counter, 1);
    remove();
    div.dispatchEvent(new dom.window.CustomEvent('click'));
    t.is(counter, 1);
});