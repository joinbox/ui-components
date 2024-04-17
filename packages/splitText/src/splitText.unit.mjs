import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async (hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['splitText.window.js'], hideErrors });
};

// We must use a DOM as line breaks need to be measured in the element the content is in
test('throws errors if arguments are not valid', async (t) => {
    const { window } = await setup(true);
    // Throws if element is missing
    try {
        window.splitTextContent();
        t.fail('did not throw');
    } catch (err) {
        t.is(err.message.includes('type HTMLElement, is undefined'), true);
    }
});

test('splits letters, words and lines', async (t) => {
    const { document, errors, window } = await setup(true);
    const div = document.createElement('div');
    div.innerHTML = 'Test – l&nbsp;tters';
    window.splitText({
        element: div,
    });
    t.is(div.querySelectorAll('.letter').length, 14);
    t.is(div.querySelectorAll('.word').length, 3);
    t.is(div.querySelectorAll('.line').length, 1);
    t.is(errors.length, 0);
});

test('accepts custom functions', async (t) => {
    const { document, errors, window } = await setup(true);
    const div = document.createElement('div');
    div.textContent = 'Test – letters';
    window.splitText({
        element: div,
        wrapLetter: (content) => `<div class='my-letter'>${content}</div>`,
        wrapWord: (content) => `<div class='my-word'>${content}</div>`,
        wrapLine: (content) => `<div class='my-line'>${content}</div>`,
    });
    t.is(div.querySelectorAll('.my-letter').length, 14);
    t.is(div.querySelectorAll('.my-word').length, 3);
    // Accepts/passes custom wrapper functions
    t.is(div.querySelectorAll('.my-line').length, 1);
    t.is(errors.length, 0);
});

test('splits letters', async (t) => {
    const { document, errors, window } = await setup(true);
    const div = document.createElement('div');
    div.textContent = 'Test – letters';
    window.splitText({
        element: div,
        wrapWord: false,
        wrapLine: false,
    });
    t.is(div.querySelectorAll('.letter').length, 14);
    t.is(div.querySelector('.word'), null);
    t.is(div.querySelector('.line'), null);
    t.is(errors.length, 0);
});

test('splits words', async (t) => {
    const { document, errors, window } = await setup(true);
    const div = document.createElement('div');
    div.textContent = 'Test – letters';
    window.splitText({
        element: div,
        wrapLetter: false,
        wrapLine: false,
    });
    t.is(div.querySelectorAll('.word').length, 3);
    t.is(div.querySelector('.letter'), null);
    t.is(div.querySelector('.line'), null);
    t.is(errors.length, 0);
});

test('splits lines', async (t) => {
    const { document, errors, window } = await setup(true);
    const div = document.createElement('div');
    div.textContent = 'Test – letters';
    window.splitText({
        element: div,
        wrapWord: false,
        wrapLetter: false,
    });
    t.is(div.querySelectorAll('.line').length, 1);
    t.is(div.querySelector('.word'), null);
    t.is(div.querySelector('.letter'), null);
    t.is(errors.length, 0);
});

test('returns function that restores original state', async (t) => {
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

test('updates on resize', async (t) => {
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
    await new Promise((resolve) => setTimeout(resolve, 500));
    t.is(div.querySelectorAll('span').length > 0, true);
    // First span is a different one than before
    t.not(div.querySelector('span'), firstChild);
    t.is(errors.length, 0);
});

test('accepts updateOnResize property', async (t) => {
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

test('works with nested HTML tags', async (t) => {
    const { document, errors, window } = await setup(true);
    const div = document.createElement('div');
    // Make sure there are tags with and without adjacent spaces
    div.innerHTML = 'a <b><a>test</a> c</b> d';
    window.splitText({
        element: div,
    });
    // Make sure spaces are preserved around tags
    t.is(div.textContent, 'a test c d');
    const letters = [...div.querySelectorAll('.letter')];
    t.is(letters.length, 10);
    // Check if indices count correctly (they might be reset at every nested tag that we encounter)
    t.is(letters.at(-1).dataset.letterIndex, '9');
    const words = [...div.querySelectorAll('.word')];
    t.is(words.length, 4);
    t.is(words.at(-1).dataset.wordIndex, '3');
    const lines = [...div.querySelectorAll('.line')];
    t.is(lines.length, 1);
    t.is(errors.length, 0);
});

