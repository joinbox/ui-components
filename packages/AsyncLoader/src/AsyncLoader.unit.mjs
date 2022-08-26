import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['AsyncLoaderElement.js'], hideErrors });
};

/**
 * Creates a simple fetch polyfill that does not require network or fs access
 * @param {int} status             HTTP status to return
 * @param {string} response        Response content to return
 * @param {boolean} failOnParse    If request should fail on calling text()
 * @returns {function}
 */
const polyfillFetch = (status, response, failOnParse = false, expectedURL = false) => (
    (url) => {
        // Make sure we also validate the URL
        if (expectedURL !== false && url !== expectedURL) {
            throw new Error(`AsyncLoader: URL ${url} does not match expected URL ${expectedURL}.`);
        }
        return new Promise((fetchResolve) => fetchResolve({
            status,
            url,
            ok: status >= 200 && status < 300,
            text: () => new Promise((textResolve, textReject) => {
                if (failOnParse) textReject(new Error('text() failed'));
                else textResolve(response);
            }),
        }));
    }
);

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};

test('throws on missing parameters', async(t) => {
    const { document, window, errors } = await setup(true);
    window.fetch = polyfillFetch(404);
    const loader = createElement(document,
        `<async-loader>
        </async-loader>`);
    document.body.appendChild(loader);
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('Attribute data-endpoint-url does'), true);
});


test('displays valid content indicator', async(t) => {
    const { document, window, errors } = await setup(true);
    window.fetch = polyfillFetch(200, '<h2>Test</h2>');
    const loader = createElement(document,
        `<async-loader data-endpoint-url="testContent.html" data-trigger-event-name="loadData">
            <div data-content-container>Initial</div>
            <template data-loading-template>Loading ...</template>
            <template data-error-template>Error: {{message}}</template>
        </async-loader>`);
    document.body.appendChild(loader);
    const container = loader.querySelector('[data-content-container]');
    t.is(container.innerHTML, 'Initial');

    loader.dispatchEvent(new window.CustomEvent('loadData', { bubbles: true }));
    t.is(container.innerHTML, 'Loading ...');

    await new Promise((resolve) => setTimeout(resolve, 0));
    t.is(container.innerHTML, '<h2>Test</h2>');
    t.is(errors.length, 0);
});


test('displays error if request fails', async(t) => {
    const { document, window, errors } = await setup(true);
    window.fetch = polyfillFetch(404);
    const loader = createElement(document,
        `<async-loader data-endpoint-url="testContent.html" data-trigger-event-name="loadData">
            <div data-content-container>Initial</div>
            <template data-error-template>Error: {{message}}</template>
        </async-loader>`);
    document.body.appendChild(loader);
    const container = loader.querySelector('[data-content-container]');
    loader.dispatchEvent(new window.CustomEvent('loadData', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    t.is(container.innerHTML, 'Error: Status 404');
    t.is(errors.length, 0);
});


test('displays error if request cannot be parsed', async(t) => {
    const { document, window, errors } = await setup(true);
    window.fetch = polyfillFetch(200, 'test', true);
    const loader = createElement(document,
        `<async-loader data-endpoint-url="testContent.html" data-trigger-event-name="loadData">
            <div data-content-container>Initial</div>
            <template data-error-template>Error: {{message}}</template>
        </async-loader>`);
    document.body.appendChild(loader);
    const container = loader.querySelector('[data-content-container]');
    loader.dispatchEvent(new window.CustomEvent('loadData', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    t.is(container.innerHTML, 'Error: text() failed');
    t.is(errors.length, 0);
});


test('filters trigger event', async(t) => {
    const { document, window, errors } = await setup(true);
    window.fetch = polyfillFetch(200, 'allGood');
    const loader = createElement(document,
        `<async-loader
            data-endpoint-url="testContent.html"
            data-trigger-event-name="loadData"
            data-trigger-event-filter="event.detail.isValid === true"
        >
            <div data-content-container>Original</div>
        </async-loader>`);
    document.body.appendChild(loader);
    const container = loader.querySelector('[data-content-container]');
    // Dispatch invalid event that should be filtered out
    loader.dispatchEvent(new window.CustomEvent('loadData',
        { bubbles: true, detail: { isValid: false } }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    t.is(container.innerHTML, 'Original');
    // Dispatch valid even tthat should fetch data
    loader.dispatchEvent(new window.CustomEvent('loadData',
        { bubbles: true, detail: { isValid: true } }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    t.is(container.innerHTML, 'allGood');
    t.is(errors.length, 0);
});

