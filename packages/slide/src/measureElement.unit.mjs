import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async (hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['measureElement.export.js'], hideErrors });
};

test('measures correctly', async (t) => {
    const { document, errors, window } = await setup(true);
    Object.defineProperty(
        window.HTMLElement.prototype,
        'scrollWidth',
        {
            configurable: true,
            get() {
                return this._scrollWidth || 0;
            },
            set(val) {
                this._scrollWidth = val;
            },
        },
    );
    window.requestAnimationFrame = (cb) => setTimeout(cb, 10);
    const div = document.createElement('div');
    div.scrollWidth = '80';
    document.body.appendChild(div);
    const script = document.createElement('script');
    script.textContent = `
        (async () => {
            const div = document.querySelector('div');
            const width = await measureElement({ element: div, dimensionName: 'Width' });
            div.innerHTML = width;
        })();
    `;
    document.body.appendChild(script);
    await new Promise((resolve) => setTimeout(resolve, 10));
    t.is(div.innerHTML, '80');
    // Was reset to the original value
    t.is(errors.length, 0);
});

test('re-sets dimension and transition', async (t) => {
    const { document, errors, window } = await setup(true);
    window.requestAnimationFrame = (cb) => setTimeout(cb, 10);
    // Create a div with height and transition styles
    const div = document.createElement('div');
    div.style.height = '50px';
    div.style.transitionProperty = 'height';
    document.body.appendChild(div);
    const script = document.createElement('script');
    script.textContent = `
        const div = document.querySelector('div');
        measureElement({ element: div });
    `;
    document.body.appendChild(script);
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    // Height ans transition are re-set to their original value
    t.is(div.style.height, '50px');
    t.is(div.style.transitionProperty, 'height');
    t.is(errors.length, 0);
});
