import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['adjustDimension.export.js'], hideErrors });
};

test('fails with invalid element', async(t) => {
    const { document, errors } = await setup(true);
    const script = document.createElement('script');
    script.textContent = `
    adjustDimension();
    `;
    document.body.appendChild(script);
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('instance of HTMLElement'), true);
});

test('fails with invalid dimension', async(t) => {
    const { document, errors } = await setup(true);
    const script = document.createElement('script');
    script.textContent = `
        adjustDimension(document.querySelector('body'), other);
    `;
    document.body.appendChild(script);
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('other'), true);
});

test('adjusts dimensions', async(t) => {
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

    const script = document.createElement('script');
    script.textContent = `
        adjustDimension(document.querySelector('.widthDiv'), 'width');
        adjustDimension(document.querySelector('.heightDiv'));
    `;
    document.body.appendChild(script);

    t.is(widthDiv.style.width, '40px');
    t.is(heightDiv.style.height, '50px');

    const heightTransitionEndEvent = new window.CustomEvent('transitionend');
    // Add property propertyName directly to event
    heightTransitionEndEvent.propertyName = 'height';
    heightDiv.dispatchEvent(heightTransitionEndEvent);

    const widthTransitionEndEvent = new window.CustomEvent('transitionend');
    widthTransitionEndEvent.propertyName = 'width';
    widthDiv.dispatchEvent(widthTransitionEndEvent);

    t.is(widthDiv.style.width, 'auto');
    t.is(heightDiv.style.height, 'auto');
    t.is(heightDiv.style.overflowX, 'auto');
    t.is(widthDiv.style.overflowY, 'auto');

    t.is(errors.length, 0);
});
