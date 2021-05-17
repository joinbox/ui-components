import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';
import findIdenticals from './findIdenticals.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['handleLinkClicks.window.js'], hideErrors });
};

test('returns identical elements', async(t) => {
    const { document, errors } = await setup(true);
    const link1 = document.createElement('a');
    link1.setAttribute('data-preserve-id', 'yes-please');
    const link2 = document.createElement('a');
    link2.setAttribute('data-preserve-id', 'yes-please');
    const link3 = document.createElement('a');
    link3.setAttribute('data-preserve-id', 'nope');
    const originalFragment = document.createDocumentFragment();
    originalFragment.appendChild(link1);
    const newFragment = document.createDocumentFragment();
    newFragment.appendChild(link3);
    newFragment.appendChild(link2);
    const result = findIdenticals({
        originalNode: originalFragment,
        newNode: newFragment,
        canBeIdentical: element => element.hasAttribute('data-preserve-id'),
        isIdentical: (a, b) => a.dataset.preserveId === b.dataset.preserveId,
    });
    t.deepEqual(result, [
        [link1, link2],
    ]);
    t.is(errors.length, 0);
});
