/* eslint max-classes-per-file: ["error", 20] */

import test from 'ava';
import RequestPool from './RequestPool.mjs';

const createRequestObject = () => class {
    fetch() {}
    addHandler() {}
};


test('throws on wrong initialization', (t) => {
    t.throws(() => new RequestPool(), { message: /Missing mandatory argument requestObject/ });
    t.throws(() => new RequestPool(class {}), { message: /mandatory method 'fetch'/ });
    t.throws(() => new RequestPool(class { fetch() {} }), { message: /mandatory method 'addHandler'/ });
    t.notThrows(() => new RequestPool(createRequestObject()));
});


test('throws when loadContent is called with invalid request configuration', (t) => {
    const pool = new RequestPool(createRequestObject());
    t.throws(() => pool.loadContent({ queryString: 5 }), { message: /Property 'queryString'.*is 5 instead/ });
});


test('throws when addHandler is called with an invalid handler', (t) => {
    const pool = new RequestPool(createRequestObject());
    t.throws(() => pool.addHandler({}), { message: /'updateResponseStatus' property.*is undefined instead/ });
    t.throws(() => pool.addHandler({ updateResponseStatus: 6 }), { message: /'updateResponseStatus' property.*is 6 instead/ });
    t.throws(() => pool.addHandler({ updateResponseStatus: () => {}, assembleURL: 5 }), { message: /'assembleURL' property.*is 5 instead/ });
});


test('calls all added handlers\' assembleURL method, fetches data, distributes it', async (t) => {
    // What URLs are fetched?
    const fetchURLs = [];
    // How many times is the fetch() function on any of the Requests called (combined together)?
    let fetchRequestCount = 0;
    // What are the responses returned to updateResponseStatus?
    const responses = [];
    // What are the signals passed to all instances of Request?
    const signals = [];
    // How many instances of Request are created?
    let requestInitializedCount = 0;
    // What are the parameters passed to assembleURL?
    const assembleURLParams = [];

    // A mock request class that we'll inject into RequestPool; use Request usually.
    class Request {
        url;
        handlers = [];

        constructor({ url, signal } = {}) {
            requestInitializedCount += 1;
            fetchURLs.push(url);
            signals.push(signal);
            this.url = url;
        }

        addHandler(handler) {
            this.handlers.push(handler);
        }

        fetch() {
            fetchRequestCount++;
            this.handlers.forEach((handler) => handler(`response-${this.url}`));
        }
    }

    const pool = new RequestPool(Request);

    const createHandler = (url) => ({
        assembleURL: (args) => {
            assembleURLParams.push(args);
            return url;
        },
        updateResponseStatus: (...args) => {
            responses.push({ url, response: args });
        },
    });

    // AssembleURL returns null
    pool.addHandler(createHandler('url1'));
    pool.addHandler(createHandler(null));
    pool.addHandler(createHandler('url2'));
    pool.addHandler(createHandler('url1'));

    // Invoke all handlers (by loading content on RequestPool)
    const queryParams = new URLSearchParams('a=b&c=d');
    pool.loadContent({ queryString: queryParams });

    // Check if assembleURL was called with the correct arguments; 4 handlers have an assembleURL
    // function
    t.is(assembleURLParams.length, 4);
    assembleURLParams.forEach((param) => t.deepEqual(param, { queryString: queryParams }));

    // Check if URLs returned by all handler's assembleURL method are fetched; duplicates (in our
    // case 'url1' are excluded)
    t.deepEqual(fetchURLs, ['url1', 'url2']);

    // 2 URLs are the same; threfore only 2 request classes should have been in instantiazed
    t.is(requestInitializedCount, 2);

    // Check if all requests were made
    t.is(fetchRequestCount, 2);

    await new Promise((resolve) => setTimeout(resolve));

    // Check if updateResponseStatus was called correctly
    t.is(responses.length, 3);
    t.deepEqual(responses[0], { url: 'url1', response: ['response-url1'] });
    t.deepEqual(responses[1], { url: 'url1', response: ['response-url1'] });
    t.deepEqual(responses[2], { url: 'url2', response: ['response-url2'] });

    // All signals are instances of AbortSignal
    t.is(signals.every((signal) => signal instanceof AbortSignal), true);

});


test('previous requests are aborted', (t) => {
    const signals = [];

    // A mock request class that we'll inject into RequestPool; use Request usually.
    class Request {
        url;
        handlers = [];

        constructor({ url, signal } = {}) {
            signals.push(signal);
            this.url = url;
        }

        addHandler() {}

        fetch() {}
    }

    const pool = new RequestPool(Request);

    pool.addHandler({
        assembleURL: () => 'url1',
        updateResponseStatus: () => {},
    });

    pool.loadContent({ queryString: new URLSearchParams('a=b') });
    pool.loadContent({ queryString: new URLSearchParams('a=b') });

    t.is(signals.length, 2);
    t.is(signals[0].aborted, true);
    t.is(signals[1].aborted, false);

});
