import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['splitText.window.js'], hideErrors });
};

// We must use a DOM as line breaks need to be measured in the element the content is in
test('throws errors if arguments are not valid', async(t) => {
    const { document, window } = await setup(true);
    const div = document.createElement('div');
    // Throws if element is missing
    try {
        window.splitTextContent();
        t.fail('did not throw');
    } catch (err) {
        t.is(err.message.includes('type HTMLElement, is undefined'), true);
    }
});

test('splits letters', async(t) => {
    const { document, errors, window } = await setup(true);
    const div = document.createElement('div');
    div.textContent = 'Test – letters';
    window.splitText({
        element: div,
        wrapLine: content => `<div class='my-line'>${content}</div>`,
    });
    t.is(div.querySelectorAll('.letter').length > 0, true);
    t.is(div.querySelectorAll('.word').length > 0, true);
    // Accepts/passes custom wrapper functions
    t.is(div.querySelectorAll('.my-line').length > 0, true);
    t.is(errors.length, 0);
});

test('returns function that restores original state', async(t) => {
    const { document, errors, window } = await setup(true);
    const div = document.createElement('div');
    div.textContent = 'Test – letters';
    const restore = window.splitText({
        element: div,
    });
    t.is(div.querySelectorAll('.line').length > 0, true);
    t.is(typeof restore, 'function');
    restore();
    t.is(div.querySelectorAll('.line').length, 0);
    t.is(errors.length, 0);
});

test('updates on resize', async(t) => {
    const { document, errors, window } = await setup(true);
    const div = document.createElement('div');
    div.textContent = 'Test – letters';
    window.splitText({
        element: div,
    });
    const firstChild = div.querySelector('span');
    t.is(div.querySelectorAll('span').length > 0, true);
    window.dispatchEvent(new window.CustomEvent('resize'));
    t.is(div.querySelectorAll('span').length, 0);
    await new Promise(resolve => setTimeout(resolve, 500));
    t.is(div.querySelectorAll('span').length > 0, true);
    // First span is a different one than before
    t.not(div.querySelector('span'), firstChild);
    t.is(errors.length, 0);
});

test('accepts updateOnResize property', async(t) => {
    const { document, errors, window } = await setup(true);
    const div = document.createElement('div');
    div.textContent = 'Test – letters';
    window.splitText({
        element: div,
        updateOnResize: false,
    });
    const amountOfSpans = div.querySelectorAll('span').length;
    window.dispatchEvent(new window.CustomEvent('resize'));
    t.is(div.querySelectorAll('span').length, amountOfSpans);
    t.is(errors.length, 0);
});

