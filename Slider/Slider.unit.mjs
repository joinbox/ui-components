import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['OverlayElement.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};

test('throws if required attributes are missing', async(t) => {
    const { document, errors } = await setup(true);
    document.createElement('overlay-component');
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('Attribute data-name'), true);
});
