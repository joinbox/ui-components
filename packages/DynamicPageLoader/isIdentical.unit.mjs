import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';
import isIdentical from './isIdentical.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['handleLinkClicks.window.js'], hideErrors });
};

const createElement = (document, tag, attributes) => {
    const element = document.createElement(tag);
    attributes.forEach(([name, value]) => element.setAttribute(name, value));
    return element;
};

test('works with data-preserve-id', async(t) => {
    const { document } = await setup(true);
    const a = createElement(document, 'span', [['data-preserve-id', 'yes']]);
    const b = createElement(document, 'span', [['a', 'yes'], ['data-preserve-id', 'yes']]);
    t.is(isIdentical(a, b), true);
    const c = createElement(document, 'span', [['data-preserve-id', 'no']]);
    t.is(isIdentical(a, c), false);
});

test('returns false if data-preserve-id is undefined', async(t) => {
    const { document } = await setup(true);
    const a = createElement(document, 'span', []);
    const b = createElement(document, 'span', []);
    t.is(isIdentical(a, b), false);
});

test('works with valid same-attribute-elements', async(t) => {
    const { document } = await setup(true);
    const a = createElement(document, 'link', [['a', 'ya'], ['b', 'yb']]);
    const b = createElement(document, 'link', [['b', 'yb'], ['a', 'ya']]);
    t.is(isIdentical(a, b), true);
});

test('invalid same-attribute-elements return false', async(t) => {
    const { document } = await setup(true);
    // script is not a valid element for same attributes
    const a = createElement(document, 'script', [['a', 'ya']]);
    const b = createElement(document, 'script', [['a', 'ya']]);
    t.is(isIdentical(a, b), false);
});
