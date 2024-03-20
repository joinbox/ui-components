import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async (hideErrors) => {
    const jsdomOptions = (jsdom) => {
        class CustomResourceLoader extends jsdom.ResourceLoader {
            fetch(url) {
                return new Promise((resolve) => {
                    const content = `document.querySelector('.container').textContent += '${url.slice(-1)}';`;
                    setTimeout(resolve(Buffer.from(content)), 20);
                });
            }
        }
        return { resources: new CustomResourceLoader() };
    };
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({
        basePath,
        scripts: ['loadScriptsInOrder.window.js'],
        hideErrors,
        jsdomOptions,
    });
};

test('loads scripts in order', async (t) => {
    const { errors, window, document } = await setup(true);
    const container = document.createElement('div');
    container.classList.add('container');
    document.body.appendChild(container);
    // await window.loadScriptsInOrder(['https://raw.githubusercontent.com/joinbox/ui-components/main/packages/DynamicPageLoader/src/createNode.window.js']);
    await window.loadScriptsInOrder([
        'https://test.com?order=1',
        'https://test.com?order=2',
        'https://test.com?order=3',
    ]);
    t.is(container.textContent, '123');
    t.is(errors.length, 0);
});

