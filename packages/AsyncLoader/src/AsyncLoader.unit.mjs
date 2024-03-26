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
    t.is(errors[0].message.includes('Expected attribute data-trigger-event-name'), true);
});


test('displays successfully fetched content', async (t) => {
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


test('displays error if request fails', async (t) => {
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


test('displays specific error for status code if request fails', async (t) => {
    const { document, window, errors } = await setup(true);
    window.fetch = polyfillFetch(404, 'notFound');
    const loader = createElement(document,
        `<async-loader
            data-endpoint-url="testContent.html"
            data-trigger-event-name="loadData"
        >
            <div data-content-container>Initial</div>
            <template data-error-template>Error: {{message}}</template>
            <template data-error-404-template>404 Not Found: {{message}}</template>
        </async-loader>`);
    document.body.appendChild(loader);
    const container = loader.querySelector('[data-content-container]');
    loader.dispatchEvent(new window.CustomEvent('loadData', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    t.is(container.innerHTML, '404 Not Found: Status 404');
    t.is(errors.length, 0);
});

test('displays error if request cannot be parsed', async (t) => {
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

test('filters trigger event', async (t) => {
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

test('loads data only multiple times if once is not used', async (t) => {
    const { document, window, errors } = await setup(true);
    window.fetch = polyfillFetch(200, 'onceTest');
    const loader = createElement(document,
        `<async-loader
            data-endpoint-url="oncetest.html"
            data-trigger-event-name="loadData"
        >
            <div data-content-container>Original</div>
        </async-loader>`);
    let loadedCount = 0;
    window.addEventListener('asyncLoaderSuccess', () => loadedCount++);
    document.body.appendChild(loader);
    loader.dispatchEvent(new window.CustomEvent('loadData', { bubbles: true }));
    loader.dispatchEvent(new window.CustomEvent('loadData', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    t.is(loadedCount, 2);
    t.is(errors.length, 0);
});

test('loads data only once if specified', async (t) => {
    const { document, window, errors } = await setup(true);
    window.fetch = polyfillFetch(200, 'onceTest');
    const loader = createElement(document,
        `<async-loader
            data-endpoint-url="oncetest.html"
            data-trigger-event-name="loadData"
            data-load-once
        >
            <div data-content-container>Original</div>
        </async-loader>`);
    let loadedCount = 0;
    window.addEventListener('asyncLoaderSuccess', () => loadedCount++);
    document.body.appendChild(loader);
    loader.dispatchEvent(new window.CustomEvent('loadData', { bubbles: true }));
    loader.dispatchEvent(new window.CustomEvent('loadData', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    t.is(loadedCount, 1);
    t.is(errors.length, 0);
});

test('dispatches success event if content was loaded successfully', async (t) => {
    const { document, window, errors } = await setup(true);
    window.fetch = polyfillFetch(200, 'allGood');
    const loader = createElement(document,
        `<async-loader
            data-endpoint-url="testContent.html"
            data-trigger-event-name="loadData"
        >
            <div data-content-container>Original</div>
        </async-loader>`);
    document.body.appendChild(loader);
    const succeeded = [];
    window.addEventListener('asyncLoaderSuccess', (ev) => succeeded.push(ev));
    loader.dispatchEvent(new window.CustomEvent('loadData', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    t.is(succeeded.length, 1);
    t.is(succeeded[0].detail.url, 'testContent.html');
    t.is(succeeded[0].detail.element, loader);
    t.is(typeof succeeded[0].detail.response, 'object');
    t.is(succeeded[0].detail.response.status, 200);
    t.is(errors.length, 0);
});

test('dispatches fail event if loading content failed', async (t) => {
    const { document, window, errors } = await setup(true);
    window.fetch = polyfillFetch(404, 'notFound');
    const loader = createElement(document,
        `<async-loader
            data-endpoint-url="testContent.html"
            data-trigger-event-name="loadData"
        >
            <div data-content-container>Original</div>
            <template data-error-template>Error: {{message}}</template>
        </async-loader>`);
    document.body.appendChild(loader);
    const failed = [];
    // Request fails because status returned by polyfilled fetch is 404
    window.addEventListener('asyncLoaderFail', (ev) => failed.push(ev));
    loader.dispatchEvent(new window.CustomEvent('loadData', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    t.is(failed.length, 1);
    t.is(failed[0].detail.url, 'testContent.html');
    t.is(failed[0].detail.element, loader);
    t.is(typeof failed[0].detail.response, 'object');
    t.is(failed[0].detail.response.status, 404);
    t.is(errors.length, 0);
});

test('loads data from endpoint url passed in event payload', async (t) => {
    const { document, window, errors } = await setup(true);
    window.fetch = polyfillFetch(200, '<h2>Test</h2>');
    const loader = createElement(document,
        `<async-loader
            data-event-endpoint-property-name="endPointUrl"
            data-trigger-event-name="loadData"
        >
            <div data-content-container>Initial</div>
            <template data-error-template>Error: {{message}}</template>
        </async-loader>`);
    document.body.appendChild(loader);
    const container = loader.querySelector('[data-content-container]');
    t.is(container.innerHTML, 'Initial');

    loader.dispatchEvent(new window.CustomEvent('loadData', { bubbles: true, detail: { endPointUrl: 'testContent.html' } }));

    await new Promise((resolve) => setTimeout(resolve, 0));
    t.is(container.innerHTML, '<h2>Test</h2>');
    t.is(errors.length, 0);
});


test('Attribute data-endpoint-url overrides data-event-endpoint-property-name if both are set', async (t) => {
    const { document, window, errors } = await setup(true);
    window.fetch = polyfillFetch(200, '<h2>Test</h2>', false, 'testContent.html');
    const loader = createElement(
        document,
        `<async-loader
                data-endpoint-url="testContent.html"
                data-event-endpoint-property-name="endPointUrl"
                data-trigger-event-name="loadData"
            >
                <div data-content-container>Initial</div>
                <template data-error-template>Error: {{message}}</template>
            </async-loader>`,
    );
    document.body.appendChild(loader);
    const container = loader.querySelector('[data-content-container]');
    t.is(container.innerHTML, 'Initial');

    loader.dispatchEvent(new window.CustomEvent('loadData', { bubbles: true, detail: { endPointUrl: 'wrongTestContent.html' } }));

    await new Promise((resolve) => setTimeout(resolve, 0));
    t.is(errors.length, 0);
});
