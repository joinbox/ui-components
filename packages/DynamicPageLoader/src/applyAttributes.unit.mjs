import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';
import applyAttributes from './applyAttributes.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: [], hideErrors });
};

test('adds, updates and removes attributes', async(t) => {
    const { document, errors } = await setup(true);
    const origin = document.createElement('div');
    origin.setAttribute('data-to-add', 'add');
    origin.setAttribute('data-to-stay', 'stay');
    origin.setAttribute('data-to-update', 'afterUpdate');
    const target = document.createElement('div');
    target.setAttribute('data-to-remove', 'remove');
    target.setAttribute('data-to-update', 'update');
    target.setAttribute('data-to-stay', 'stay');
    applyAttributes(origin, target);
    t.is(target.hasAttribute('data-to-remove'), false);
    t.is(target.getAttribute('data-to-stay'), 'stay');
    t.is(target.getAttribute('data-to-update'), 'afterUpdate');
    t.is(target.getAttribute('data-to-add'), 'add');
    t.is(errors.length, 0);
});
