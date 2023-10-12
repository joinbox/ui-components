import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async (hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({
        basePath,
        scripts: ['measureElement.window.js'],
        hideErrors,
        loadScriptsAsModule: true,
    });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};

test('measures element on init', async (t) => {
    const { window, document, errors } = await setup();
    const element = createElement(document, '<div>test</div>');
    document.body.appendChild(element);
    const script = document.createElement('script');
    script.textContent = `
        window.dimensions = measureElement({ element: document.querySelector('div') });
    `;
    document.body.appendChild(script);
    ['x', 'y', 'width', 'height', 'top', 'right', 'bottom', 'left'].forEach((key) => {
        t.is(Object.prototype.hasOwnProperty.call(window.dimensions, key), true);
    });
    t.is(errors.length, 0);
});

test('updates dimensions on resize, load', async (t) => {
    const { window, document, errors } = await setup();
    const element = createElement(document, '<div>test</div>');
    document.body.appendChild(element);
    const script = document.createElement('script');
    script.textContent = `
    window.dimensions = measureElement({ element: document.querySelector('div') });
    `;
    document.body.appendChild(script);
    // Check for initial dimension
    t.is(window.dimensions.x, 0);

    // Resize
    element.getBoundingClientRect = () => ({ x: 5 });
    window.dispatchEvent(new window.CustomEvent('resize'));
    // Update only happens after a certain debounce
    t.is(window.dimensions.x, 0);
    await new Promise((resolve) => setTimeout(resolve, 100));
    t.is(window.dimensions.x, 5);

    // Load
    element.getBoundingClientRect = () => ({ x: 10 });
    window.dispatchEvent(new window.CustomEvent('load'));
    t.is(window.dimensions.x, 10);

    t.is(errors.length, 0);
});

test('does not update dimensions on intersection as per default, load', async (t) => {
    const { window, document, errors } = await setup();
    const element = createElement(document, '<div>test</div>');
    document.body.appendChild(element);

    let intersectionCallback;
    class IntersectionObserver {
        constructor(callback) {
            intersectionCallback = callback;
        }

        observe() {}
    }
    window.IntersectionObserver = IntersectionObserver;

    const script = document.createElement('script');
    script.textContent = `
    window.dimensions = measureElement({ element: document.querySelector('div') });
    `;
    document.body.appendChild(script);
    // Because IntersectionObserver was not invoked by measureElement, intersectionCallback
    // should still be undefined
    t.is(intersectionCallback, undefined);

    const scriptWithIntersectionObserver = document.createElement('script');
    scriptWithIntersectionObserver.textContent = `
    window.dimensions = measureElement({ element: document.querySelector('div'), updateOnIntersection: true });
    `;
    document.body.appendChild(scriptWithIntersectionObserver);
    element.getBoundingClientRect = () => ({ x: 10 });
    intersectionCallback();
    t.is(window.dimensions.x, 10);

    t.is(errors.length, 0);
});

test('exposes a working update method', async (t) => {
    const { window, document, errors } = await setup();
    const element = createElement(document, '<div>test</div>');
    document.body.appendChild(element);
    const script = document.createElement('script');
    script.textContent = `
        window.dimensions = measureElement({ element: document.querySelector('div') });
    `;
    document.body.appendChild(script);
    t.is(window.dimensions.x, 0);
    element.getBoundingClientRect = () => ({ x: 5 });
    const updateScript = document.createElement('script');
    updateScript.textContent = 'window.dimensions.update();';
    document.body.appendChild(updateScript);
    t.is(window.dimensions.x, 5);
    t.is(errors.length, 0);
});

test('exposes a working destroy method', async (t) => {
    const { window, document, errors } = await setup();
    const element = createElement(document, '<div>test</div>');
    document.body.appendChild(element);
    const script = document.createElement('script');
    script.textContent = `
        window.dimensions = measureElement({ element: document.querySelector('div') });
    `;
    document.body.appendChild(script);
    element.getBoundingClientRect = () => ({ x: 5 });
    const destroyScript = document.createElement('script');
    destroyScript.textContent = 'window.dimensions.destroy();';
    document.body.appendChild(destroyScript);
    window.dispatchEvent(new window.CustomEvent('resize'));
    t.is(window.dimensions.x, 0);
    t.is(errors.length, 0);
});

