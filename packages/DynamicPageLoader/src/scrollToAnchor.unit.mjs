import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async (hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['scrollToAnchor.window.js'], hideErrors });
};

test('does not scroll if target is not available', async (t) => {
    const { errors, window } = await setup(true);
    const scrolls = [];
    window.scrollTo = (pos) => scrolls.push(pos);
    window.location.hash = '#test';
    window.scrollToAnchor();
    t.is(window.scrollX, 0);
    t.is(scrolls.length, 0);
    t.is(errors.length, 0);
});

test('scrolls if element is available', async (t) => {
    const { document, errors, window } = await setup(true);
    const scrolls = [];
    window.scrollTo = (...pos) => scrolls.push(pos);
    const target = document.createElement('div');
    target.getBoundingClientRect = () => ({ top: 100 });
    document.body.scrollTop = 200;
    target.setAttribute('id', 'test');
    document.body.appendChild(target);
    window.location.hash = '#test';
    window.scrollToAnchor();
    t.is(scrolls.length, 1);
    t.deepEqual(scrolls[0], [0, 200]);
    t.is(errors.length, 0);
});

