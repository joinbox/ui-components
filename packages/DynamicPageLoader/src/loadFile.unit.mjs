import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['loadFile.window.js'], hideErrors });
};

test('fetches element, converts it to DOM tree', async(t) => {
    const { window, document, errors } = await setup(true);
    const script = document.createElement('script');
    window.fetch = () => new Promise(resolveFetch => resolveFetch({
        text: () => new Promise(resolveText => resolveText('<div class="myDiv"></div>')),
    }));
    script.textContent = `
        (async() => {
            const divDom = await loadFile('loadFile.test.html');
            document.body.appendChild(divDom);
        })();
    `;
    document.body.appendChild(script);
    // Script in DOM uses async; do the same here
    await new Promise(resolve => setTimeout(resolve));
    const div = document.body.querySelector('.myDiv');
    t.not(div, null);
    t.is(errors.length, 0);
});
