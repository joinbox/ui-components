import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

// No unit tests are needed momentarily as all relevant functionality is tested within RequestPool.

const setup = async (hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['DynamicContentOrchestratorElement.js'], hideErrors });
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

test('coordinates loaders and handlers', async (t) => {
    const { document, window, errors } = await setup(true);
    window.fetch = polyfillFetch(200, 'sAllGood');

    const child = createElement(document, '<div></div>');
    const orchestrator = createElement(document,
        `<dynamic-content-orchestrator>
        </dynamic-content-orchestrator>`);
    document.body.appendChild(orchestrator);
    orchestrator.appendChild(child);

    // Collect all responses (to run tests against them)
    const responses = [];
    // Create and register a handler
    const handler = {
        assembleURL: () => 'test1',
        updateResponseStatus: (response) => responses.push(response),
    };
    child.dispatchEvent(
        new window.CustomEvent('addDynamicContentHandler', { detail: handler, bubbles: true }),
    );

    // Load content
    child.dispatchEvent(new window.CustomEvent('loadDynamicContent', {
        detail: { requestConfiguration: { queryString: new window.URLSearchParams('q=5') } },
        bubbles: true,
    }));

    await new Promise((resolve) => setTimeout(resolve));

    t.is(responses.length, 2);
    t.deepEqual(responses[0], { status: 'loading', url: 'test1' });
    t.is(responses[1].content, 'sAllGood');
    t.is(responses[1].status, 'loaded');
    t.is(responses[1].response.ok, true);
    t.is(errors.length, 0);
});

