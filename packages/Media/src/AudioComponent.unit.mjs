import test from 'ava';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['AudioComponentElement.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};


test('gets correct data-state attributes', async(t) => {
    const { window, document, errors } = await setup(true);
    /* We cannot really test as HTML Audio is not part of JSDOM and would need to be faked *and*
    injected in order to work */
    const html = '<audio-component data-source="test/file_example_MP3_700KB.mp3"></audio-component>';
    const audio = createElement(document, html);
    t.is(errors.length, 0);
});
