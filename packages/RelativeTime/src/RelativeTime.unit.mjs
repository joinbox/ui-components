import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async (hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['RelativeTimeElement.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};

test('throws on missing parameters', async (t) => {
    const { document, errors } = await setup(true);
    const element = createElement(document, '<relative-time></async-loader>');
    document.body.appendChild(element);
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('Expected attribute data-time'), true);
});

test('displays time', async (t) => {
    const { document, errors } = await setup(true);
    const twoHoursAgo = new Date(new Date().getTime() - (2 * 60 * 60 * 1000));
    const element = createElement(document, `<relative-time data-time="${twoHoursAgo.toISOString()}"></async-loader>`);
    document.body.appendChild(element);
    t.is(errors.length, 0);
    t.is(element.textContent, '2 hours ago');
});

test('uses locale', async (t) => {
    const { document, errors } = await setup(true);
    const twoHoursAgo = new Date(new Date().getTime() - (2 * 60 * 60 * 1000));
    const element = createElement(document, `<relative-time data-time="${twoHoursAgo.toISOString()}" data-locale="de"></async-loader>`);
    document.body.appendChild(element);
    t.is(errors.length, 0);
    t.is(element.textContent, 'vor 2 Std.');
});

