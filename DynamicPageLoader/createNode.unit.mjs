import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';
import createNode from './createNode.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: [], hideErrors });
};

test('clones element and attributes', async(t) => {
    const { document, errors } = await setup(true);
    const div = document.createElement('div');
    div.setAttribute('class', 'myClass');
    const clone = createNode(document, div);
    t.is(clone.tagName, 'DIV');
    t.is(clone.getAttribute('class'), 'myClass');
});
