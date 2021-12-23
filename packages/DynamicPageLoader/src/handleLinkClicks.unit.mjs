import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    const jsdomOptions = { url: 'https://joinbox.com' };
    return getDOM({ basePath, scripts: ['handleLinkClicks.window.js'], hideErrors, jsdomOptions });
};

test('dispatches urlchange event and updates state', async(t) => {
    const { window, document, errors } = await setup(true);
    const link = document.createElement('a');
    link.setAttribute('href', '/test');
    document.body.appendChild(link);
    const script = document.createElement('script');
    script.textContent = `
        const links = document.querySelectorAll('a');
        handleLinkClicks({ linkElements: links });
    `;
    const events = [];
    window.addEventListener('urlchange', (ev) => {
        events.push(ev);
    });
    document.body.appendChild(script);
    link.click();
    t.is(events.length, 1);
    t.is(events[0].detail.url, '/test');
    t.is(window.location.href, 'https://joinbox.com/test');
    t.is(errors.length, 0);
});

test('uses link element and link target for checkLink hook', async(t) => {
    const { window, document, errors } = await setup(true);
    const link = document.createElement('a');
    link.setAttribute('href', '/test');
    document.body.appendChild(link);
    const script = document.createElement('script');
    script.textContent = `
        const links = document.querySelectorAll('a');
        handleLinkClicks({ linkElements: links, checkLink: (...args) => {
            window.checkLinkData = args;
        }});
    `;
    document.body.appendChild(script);
    link.click();
    t.deepEqual(window.checkLinkData, ['/test', link]);
    t.is(errors.length, 0);
});

test('respects checkLink hook', async(t) => {
    const { window, document, errors } = await setup(true);
    const link = document.createElement('a');
    link.setAttribute('href', '/test');
    document.body.appendChild(link);
    const script = document.createElement('script');
    script.textContent = `
        const links = document.querySelectorAll('a');
        handleLinkClicks({ linkElements: links, checkLink: url => url !== '/test' });
    `;
    const events = [];
    window.addEventListener('urlchange', (ev) => {
        events.push(ev);
    });
    document.body.appendChild(script);
    link.click();
    t.is(events.length, 0);
    t.is(window.location.href, 'https://joinbox.com/');
    t.is(errors.length, 0);
});
