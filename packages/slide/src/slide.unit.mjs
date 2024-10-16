import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async (hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['slide.export.js'], hideErrors });
};

test('fails with invalid element', async (t) => {
    const { document, errors } = await setup(true);
    const script = document.createElement('script');
    script.textContent = 'slide();';
    document.body.appendChild(script);
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('be a HTMLElement'), true);
});

test('fails with invalid dimension', async (t) => {
    const { document, errors } = await setup(true);
    const script = document.createElement('script');
    script.textContent = `
        slide({ element: document.querySelector('body'), dimension: 'z' });
    `;
    document.body.appendChild(script);
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('\'x\' or \'y\''), true);
});

test('adjusts dimensions', async (t) => {
    const { document, errors, window } = await setup(true);

    const widthDiv = document.createElement('div');
    widthDiv.classList.add('widthDiv');
    widthDiv.textContent = 'test';
    document.body.appendChild(widthDiv);

    const heightDiv = document.createElement('div');
    heightDiv.classList.add('heightDiv');
    heightDiv.textContent = 'test';
    document.body.appendChild(heightDiv);

    // See here: https://github.com/jsdom/jsdom/issues/1013
    Object.defineProperty(
        window.HTMLElement.prototype,
        'scrollHeight',
        {
            configurable: true,
            get() {
                return this._scrollHeight || 0;
            },
            set(val) {
                this._scrollHeight = val;
            },
        },
    );
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
    heightDiv.scrollHeight = 50;
    widthDiv.scrollWidth = 40;
    window.requestAnimationFrame = (cb) => cb();

    // Test sliding to their intrinisc height and width
    const script = document.createElement('script');
    script.textContent = `
        slide({ element: document.querySelector('.widthDiv'), dimension: 'x' });
        slide({ element: document.querySelector('.heightDiv') });
    `;
    document.body.appendChild(script);

    await new Promise((resolve) => setTimeout(resolve));

    t.is(heightDiv.style.height, '50px');
    t.is(widthDiv.style.width, '40px');

    const heightTransitionEndEvent = new window.CustomEvent('transitionend');
    // Add property propertyName directly to event
    heightTransitionEndEvent.propertyName = 'height';
    heightDiv.dispatchEvent(heightTransitionEndEvent);

    const widthTransitionEndEvent = new window.CustomEvent('transitionend');
    widthTransitionEndEvent.propertyName = 'width';
    widthDiv.dispatchEvent(widthTransitionEndEvent);
    await new Promise((resolve) => setTimeout(resolve));
    t.is(heightDiv.style.height, 'auto');
    t.is(widthDiv.style.width, 'auto');

    // Test sliding to a smaller value (where we must set height to 0 first to measure the
    // scrollHeight correctly)
    heightDiv.scrollHeight = 20;
    widthDiv.scrollWidth = 30;
    // Object.defineProperty(window.HTMLElement.prototype, 'scrollHeight', { value: 30 });

    const reduceScript = document.createElement('script');
    reduceScript.textContent = `
        slide({ element: document.querySelector('.widthDiv'), dimension: 'x' });
        slide({ element: document.querySelector('.heightDiv') });
    `;
    document.body.appendChild(reduceScript);

    t.is(heightDiv.style.height, '20px');
    t.is(widthDiv.style.width, '30px');

    widthDiv.dispatchEvent(widthTransitionEndEvent);
    heightDiv.dispatchEvent(heightTransitionEndEvent);
    await new Promise((resolve) => setTimeout(resolve));
    t.is(widthDiv.style.width, 'auto');
    t.is(heightDiv.style.height, 'auto');

    // Test sliding without a targetSize
    const closeScript = document.createElement('script');
    closeScript.textContent = `
        slide({ element: document.querySelector('.widthDiv'), dimension: 'x', targetSize: 0 });
        slide({ element: document.querySelector('.heightDiv'), targetSize: 0 });
    `;
    document.body.appendChild(closeScript);

    t.is(widthDiv.style.width, '0px');
    t.is(heightDiv.style.height, '0px');

    // Make sure height is not set to 'auto' when the function was called with a targetSize
    heightDiv.dispatchEvent(heightTransitionEndEvent);
    await new Promise((resolve) => setTimeout(resolve));
    t.is(heightDiv.style.height, '0px');

    t.is(errors.length, 0);
});


test('calls onEnd', async (t) => {
    const { document, errors, window } = await setup(true);

    const heightDiv = document.createElement('div');
    document.body.appendChild(heightDiv);

    // Mock missing JSDOM window methods
    Object.defineProperty(window.HTMLElement.prototype, 'scrollHeight', { value: 50 });
    window.requestAnimationFrame = (cb) => cb();

    const script = document.createElement('script');
    script.textContent = `
        slide({ element: document.querySelector('div'), onEnd: () => { window.slideOnEndCalled = true; } });
    `;
    document.body.appendChild(script);
    t.is(window.slideOnEndCalled, undefined);

    await new Promise((resolve) => setTimeout(resolve));

    const heightTransitionEndEvent = new window.CustomEvent('transitionend');
    heightTransitionEndEvent.propertyName = 'height';
    heightDiv.dispatchEvent(heightTransitionEndEvent);

    t.is(window.slideOnEndCalled, true);
    t.is(errors.length, 0);
});
