import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async (hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['watchResize.window.js'], hideErrors });
};

test('calls callback after resize', async (t) => {
    const { window, document, errors } = await setup(true);
    const script = document.createElement('script');
    script.innerHTML = `
        watchResize({
            axes: ['x'],
            callback: () => {
                window.callbackCalled = true;
            },
        });
    `;
    document.body.appendChild(script);
    t.is(window.callbackCalled, undefined);
    // Resize window on y while we watch x
    window.innerHeight = 1000;
    window.dispatchEvent(new window.Event('resize'));
    t.is(window.callbackCalled, undefined);
    // Finally resize window on x
    window.innerWidth = 1000;
    window.dispatchEvent(new window.Event('resize'));
    t.is(window.callbackCalled, true);
    t.is(errors.length, 0);
});
