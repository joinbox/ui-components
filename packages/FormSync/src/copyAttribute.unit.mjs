import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';
import createElement from '../../../src/testHelpers/createElement.mjs';
import createScript from '../../../src/testHelpers/createScript.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['copyAttribute.window.js'], hideErrors });
};

const getContent = document => createElement({
    document,
    html: `<div>
        <div id="src" data-a="b">
        <div id="target" data-a="d">
    </div>`,
});


test('copies attribute', async(t) => {
    const { document, errors } = await setup(true);
    const content = getContent(document);
    document.body.appendChild(content);
    createScript({
        content: `
            copyAttribute({
                sourceElement: document.querySelector('#src'),
                targetElement: document.querySelector('#target'),
                attribute: 'data-a',
            });
        `,
        document,
    });
    const target = content.querySelector('#target');
    t.is(target.getAttribute('data-a'), 'b');
    t.is(errors.length, 0);
});


test('copies bool attribute', async(t) => {
    const { document, errors } = await setup(true);
    const content = getContent(document);
    document.body.appendChild(content);
    createScript({
        content: `
            const sourceElement = document.querySelector('#src');
            sourceElement.setAttribute('data-bool', '')
            copyAttribute({
                sourceElement,
                targetElement: document.querySelector('#target'),
                attribute: 'data-bool',
            });
        `,
        document,
    });
    const target = content.querySelector('#target');
    t.is(target.hasAttribute('data-bool'), true);
    t.is(errors.length, 0);
});


test('does not copy attribute if missing on source', async(t) => {
    const { document, errors } = await setup(true);
    const content = getContent(document);
    document.body.appendChild(content);
    createScript({
        content: `
            const sourceElement = document.querySelector('#src');
            copyAttribute({
                sourceElement,
                targetElement: document.querySelector('#target'),
                attribute: 'data-missing',
            });
        `,
        document,
    });
    const target = content.querySelector('#target');
    t.is(target.hasAttribute('data-missing'), false);
    t.is(errors.length, 0);
});


test('does not overwrite attribute', async(t) => {
    const { document, errors } = await setup(true);
    const content = getContent(document);
    document.body.appendChild(content);
    createScript({
        content: `
            copyAttribute({
                sourceElement: document.querySelector('#src'),
                targetElement: document.querySelector('#target'),
                attribute: 'data-a',
                overwrite: false,
            });
        `,
        document,
    });
    const target = content.querySelector('#target');
    t.is(target.getAttribute('data-a'), 'd');
    t.is(errors.length, 0);
});
