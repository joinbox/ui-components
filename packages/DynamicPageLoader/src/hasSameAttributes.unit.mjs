import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';
import hasSameAttributes from './hasSameAttributes.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['handleLinkClicks.window.js'], hideErrors });
};

const createDiv = (document) => {
    const div = document.createElement('div');
    div.setAttribute('a', 1);
    div.setAttribute('b', 2);
    return div;
};

test('returns true if attributes are identical', async(t) => {
    const { document } = await setup(true);
    t.is(hasSameAttributes(createDiv(document), createDiv(document)), true);
});

test('returns true with different order', async(t) => {
    const { document } = await setup(true);
    const div = document.createElement('div');
    div.setAttribute('b', 2);
    div.setAttribute('a', 1);
    t.is(hasSameAttributes(createDiv(document), div), true);
});

test('returns false if a property is missing', async(t) => {
    const { document } = await setup(true);
    const missingDiv = createDiv(document);
    // Missing attribute is the same as an additional attribute – no need to test those
    missingDiv.removeAttribute('b');
    t.is(hasSameAttributes(createDiv(document), missingDiv), false);
    t.is(hasSameAttributes(missingDiv, createDiv(document)), false);
});

