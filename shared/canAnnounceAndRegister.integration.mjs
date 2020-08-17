import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({
        basePath,
        scripts: ['canAnnounceElement.testElement.js', 'canRegisterElements.testElement.js'],
        hideErrors,
    });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
}

test('components work together with default arguments', async(t) => {
    const { document, errors, window } = await setup(true);
    const elementHTML = '<test-registrar><test-announcer></test-announcer></test-registrar>';
    const testElement = createElement(document, elementHTML);
    document.body.appendChild(testElement);
    await new Promise(resolve => setTimeout(resolve));
    if (errors.length) console.log(errors);
    t.is(errors.length, 0);
    t.is(testElement.querySelector('test-announcer').model, 'myModel');
});

