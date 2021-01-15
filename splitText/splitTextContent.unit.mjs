import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['splitTextContent.window.js'], hideErrors });
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
    // Throws if wrap(Letter|Word|Line) is not false or a function
    try {
        window.splitTextContent({ element: div, wrapLetter: 42 });
        t.fail('did not throw');
    } catch (err) {
        t.is(err.message.includes('wrapLetter must be false or a functions, is 42'), true);
    }
});

test('splits letters', async(t) => {
    const { document, errors, window } = await setup(true);
    const div = document.createElement('div');
    const content = 'Test – letters';
    div.textContent = content;
    window.splitTextContent({
        element: div,
        wrapWord: false,
        wrapLine: false,
    });
    const { children } = div;
    t.is(children.length, content.length);
    Array.from(children).forEach((child, index) => {
        t.is(child.getAttribute('data-letter-index'), `${index}`);
        t.is(child.tagName, 'SPAN');
        t.is(child.classList.contains('letter'), true);
    });
    t.is(errors.length, 0);
});

test('splits words', async(t) => {
    const { document, errors, window } = await setup(true);
    const div = document.createElement('div');
    const content = 'Test – words are! Words.';
    div.textContent = content;
    window.splitTextContent({
        element: div,
        wrapLetter: false,
        wrapLine: false,
    });
    const { children } = div;
    t.is(children.length, 4);
    const words = [...content.matchAll(/\w+/g)];
    Array.from(children).forEach((child, index) => {
        t.is(child.getAttribute('data-word-index'), `${index}`);
        t.is(child.tagName, 'SPAN');
        t.is(child.classList.contains('word'), true);
        t.is(child.innerHTML, words[index][0]);
    });
    t.is(errors.length, 0);
});

test('splits lines (and letters)', async(t) => {
    const { document, errors, window } = await setup(true);
    const div = document.createElement('div');
    const content = 'Test – words are! Words.';
    div.textContent = content;
    let boundingClientIndex = 0;
    window.HTMLElement.prototype.getBoundingClientRect = function() {
        // Increase top with every space
        if (this.innerHTML === ' ') boundingClientIndex++;
        return {
            top: boundingClientIndex,
        };
    };
    window.splitTextContent({
        element: div,
        wrapWord: false,
    });
    const { children } = div;
    t.is(children.length, content.split(/\s/g).length);
    Array.from(children).forEach((child, index) => {
        t.is(child.getAttribute('data-line-index'), `${index}`);
        t.is(child.tagName, 'SPAN');
        t.is(child.classList.contains('line'), true);
    });
    t.is(errors.length, 0);
});

test('uses custom functions passed in', async(t) => {
    const { document, errors, window } = await setup(true);
    const div = document.createElement('div');
    const content = 'Test – for Lines, Letters and Words.';
    div.textContent = content;
    const indices = {
        word: [],
        letter: [],
        line: [],
    };
    window.splitTextContent({
        element: div,
        wrapWord: (content, index) => {
            indices.word.push(index);
            return `<span class='my-word'>${content}</span>`;
        },
        wrapLetter: (content, index) => {
            indices.letter.push(index);
            return `<span class='my-letter'>${content}</span>`;
        },
        wrapLine: (content, index) => {
            indices.line.push(index);
            return `<span class='my-line'>${content}</span>`;
        },
    });
    t.is(div.querySelectorAll('.my-word').length > 0, true);
    t.is(div.querySelectorAll('.my-letter').length > 0, true);
    t.is(div.querySelectorAll('.my-line').length > 0, true);
    t.deepEqual(indices.line, [0]);
    t.deepEqual(
        indices.letter,
        Array.from({ length: content.length }).map((value, index) => index),
    );
    t.deepEqual(
        indices.word,
        Array.from({ length: [...content.matchAll(/\w+/g)].length }).map((value, index) => index),
    );
    t.is(errors.length, 0);
});
