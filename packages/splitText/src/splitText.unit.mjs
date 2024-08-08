import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';
import awaitRAF from './awaitRAF.mjs';

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
    await awaitRAF(window);
    t.is(div.querySelectorAll('.letter').length, 12);
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
    await awaitRAF(window);
    t.is(div.querySelectorAll('.my-letter').length, 12);
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
    await awaitRAF(window);
    t.is(div.querySelectorAll('.letter').length, 12);
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
    await awaitRAF(window);
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
    await awaitRAF(window);
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
    await awaitRAF(window);
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
    await awaitRAF(window);
    const firstChild = div.querySelector('span');
    // splitText was executed
    t.is(div.querySelectorAll('span').length > 0, true);
    // Window size must change in order for resize handler to be executed
    window.innerWidth = 50;
    window.dispatchEvent(new window.CustomEvent('resize'));
    // Before the debounce is over, splitText is not applied
    t.is(div.querySelectorAll('span').length, 0);
    // After the debounce, splitText is applied
    await new Promise((resolve) => setTimeout(resolve, 500));
    await awaitRAF(window);
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
    await awaitRAF(window);
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
    await awaitRAF(window);
    // Make sure spaces are preserved around tags
    t.is(div.textContent, 'a test c d');
    const letters = [...div.querySelectorAll('.letter')];
    t.is(letters.length, 7);
    // Check if indices count correctly (they might be reset at every nested tag that we encounter)
    t.is(letters.at(-1).dataset.letterIndex, '6');
    const words = [...div.querySelectorAll('.word')];
    t.is(words.length, 4);
    t.is(words.at(-1).dataset.wordIndex, '3');
    const lines = [...div.querySelectorAll('.line')];
    t.is(lines.length, 1);
    t.is(errors.length, 0);
});

test('handles spaces at start and end correctly', async (t) => {
    const { document, errors, window } = await setup(true);
    const div = document.createElement('div');
    // Make sure there are tags with and without adjacent spaces
    div.innerHTML = '  te st  ';
    window.splitText({
        element: div,
    });
    await awaitRAF(window);
    t.is(div.querySelectorAll('.word').length, 2);
    t.is(div.querySelectorAll('.letter').length, 4);
    t.is(div.innerHTML.substring(0, 2), '  ');
    t.is(div.innerHTML.substring(div.innerHTML.length - 2), '  ');
    t.is(errors.length, 0);
});


test('does never wrap newlines, <br> or spaces, even if they\'re on their own line', async (t) => {
    const { document, errors, window } = await setup(true);
    const div = document.createElement('div');

    // Fake getBoundingClientRect: Return a growing number every time to make things look like
    // they're on a new line every time
    let previousTop = 0;
    // eslint-disable-next-line no-return-assign
    window.HTMLElement.prototype.getBoundingClientRect = () => ({ top: previousTop += 10 });

    div.innerHTML = 'te<br/>\n <br/>';
    window.splitText({
        element: div,
    });
    await awaitRAF(window);
    t.is(div.querySelectorAll('.word').length, 1);
    t.is(div.querySelectorAll('.line').length, 1);
    // <br/> will be replaced with <br> when it's inserted into the DOM
    t.is(div.innerHTML.includes('<br>\n <br>'), true);
    t.is(errors.length, 0);
});
