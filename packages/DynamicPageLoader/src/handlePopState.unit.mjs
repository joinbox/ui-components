import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    const jsdomOptions = { url: 'https://joinbox.com' };
    return getDOM({
        basePath,
        scripts: ['handlePopState.window.js'],
        hideErrors,
        jsdomOptions,
    });
};

test('dispatches urlchange event on popstate', async(t) => {
    const { window, document, errors } = await setup(true);
    const script = document.createElement('script');
    script.textContent = `
        handlePopState();
    `;
    document.body.appendChild(script);
    const events = [];
    window.addEventListener('urlchange', (ev) => {
        events.push(ev);
    });
    const popStateEvent = new window.PopStateEvent('popstate', { state: { url: '/test' } });
    window.dispatchEvent(popStateEvent);
    t.is(events.length, 1);
    t.is(events[0].detail.url, '/test');
    t.is(errors.length, 0);
});

