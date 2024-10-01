import test from 'ava';
import Request from './Request.mjs';

const createFetchMock = ({ isOk = true, response = '' } = {}) => {
    const requestedURLs = [];
    return {
        fetch: (url) => {
            requestedURLs.push(url);
            return new Promise((resolve) => {
                resolve({ ok: isOk, text: () => response });
            });
        },
        requestedURLs,
    };
};

test('throws on invalid arguments', (t) => {
    t.throws(() => new Request(), { message: /Parameter url/ });
    t.throws(() => new Request({ url: 5 }), { message: /Parameter url.*is 5 instead/ });
    t.throws(() => new Request({ url: 'test' }), { message: /Parameter signal/ });
});

test('throws on invalid handler', (t) => {
    const request = new Request({ url: '/test', signal: new AbortController().signal });
    t.throws(() => request.addHandler(5), { message: /Parameter handler.*is 5 instead/ });
});

test('calls url', async (t) => {
    const originalFetch = global.fetch;
    const { fetch, requestedURLs } = createFetchMock();
    global.fetch = fetch;
    const request = new Request({ url: '/test', signal: new AbortController().signal });
    await request.fetch();
    t.is(request.url, '/test');
    t.deepEqual(requestedURLs, ['/test']);
    global.fetch = originalFetch;
});

test('handles fails', async (t) => {
    const handlerArguments = [];
    const handler = (status) => handlerArguments.push(status);
    const originalFetch = global.fetch;
    const { fetch } = createFetchMock({ isOk: false, response: ':-(' });
    global.fetch = fetch;
    const request = new Request({ url: '/test', signal: new AbortController().signal });
    request.addHandler(handler);
    // Add handler twice to check if all are called
    request.addHandler(handler);
    await request.fetch();
    t.is(handlerArguments.length, 4);
    // Loading
    t.is(handlerArguments[0].status, 'loading');
    t.is(handlerArguments[0].url, '/test');
    t.deepEqual(handlerArguments[0], handlerArguments[1]);
    t.is(handlerArguments[2].status, 'failed');
    t.is(handlerArguments[2].content, ':-(');
    t.is(handlerArguments[2].response.ok, false);
    t.deepEqual(handlerArguments[2], handlerArguments[3]);
    global.fetch = originalFetch;
});

test('handles success', async (t) => {
    const handlerArguments = [];
    const handler = (status) => handlerArguments.push(status);
    const originalFetch = global.fetch;
    const { fetch } = createFetchMock({ response: ':-D' });
    global.fetch = fetch;
    const request = new Request({ url: '/test', signal: new AbortController().signal });
    request.addHandler(handler);
    // Add handler twice to check if all are called
    request.addHandler(handler);
    await request.fetch();
    t.is(handlerArguments.length, 4);
    // Loading
    t.is(handlerArguments[0].status, 'loading');
    t.is(handlerArguments[0].url, '/test');
    t.deepEqual(handlerArguments[0], handlerArguments[1]);
    t.is(handlerArguments[2].status, 'loaded');
    t.is(handlerArguments[2].content, ':-D');
    t.is(handlerArguments[2].response.ok, true);
    t.deepEqual(handlerArguments[2], handlerArguments[3]);
    global.fetch = originalFetch;
});
