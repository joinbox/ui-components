import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['slide.export.js'], hideErrors });
};

test('fails with invalid element', async(t) => {
    const { document, errors } = await setup(true);
    const script = document.createElement('script');
    script.textContent = 'slide();';
    document.body.appendChild(script);
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('be a HTMLElement'), true);
});

test('fails with invalid dimension', async(t) => {
    const { document, errors } = await setup(true);
    const script = document.createElement('script');
    script.textContent = `
        slide({ element: document.querySelector('body'), dimension: 'z' });
    `;
    document.body.appendChild(script);
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('\'x\' or \'y\''), true);
});

test.only('adjusts dimensions', async(t) => {
    const { document, errors, window } = await setup(true);

    const widthDiv = document.createElement('div');
    widthDiv.classList.add('widthDiv');
    widthDiv.textContent = 'test';
    document.body.appendChild(widthDiv);

    const heightDiv = document.createElement('div');
    heightDiv.classList.add('heightDiv');
    heightDiv.textContent = 'test';
    document.body.appendChild(heightDiv);

    Object.defineProperty(window.HTMLElement.prototype, 'scrollWidth', { value: 40 });
    Object.defineProperty(window.HTMLElement.prototype, 'scrollHeight', { value: 50 });
    window.requestAnimationFrame = cb => cb();

    const script = document.createElement('script');
    script.textContent = `
        slide({ element: document.querySelector('.widthDiv'), dimension: 'x' });
        slide({ element: document.querySelector('.heightDiv') });
    `;
    document.body.appendChild(script);

    await new Promise(resolve => setTimeout(resolve));

    t.is(heightDiv.style.height, '50px');
    t.is(widthDiv.style.width, '40px');

    Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', { value: 40 });
    Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', { value: 50 });

    const heightTransitionEndEvent = new window.CustomEvent('transitionend');
    // Add property propertyName directly to event
    heightTransitionEndEvent.propertyName = 'height';
    heightDiv.dispatchEvent(heightTransitionEndEvent);

    const widthTransitionEndEvent = new window.CustomEvent('transitionend');
    widthTransitionEndEvent.propertyName = 'width';
    widthDiv.dispatchEvent(widthTransitionEndEvent);

    await new Promise(resolve => setTimeout(resolve));

    t.is(widthDiv.style.width, 'auto');
    t.is(heightDiv.style.height, 'auto');

    const closeScript = document.createElement('script');
    closeScript.textContent = `
        slide({ element: document.querySelector('.widthDiv'), dimension: 'x', targetSize: 0 });
        slide({ element: document.querySelector('.heightDiv'), targetSize: 0 });
    `;
    document.body.appendChild(closeScript);

    t.is(widthDiv.style.width, '0px');
    t.is(heightDiv.style.height, '0px');

    t.is(errors.length, 0);
});
