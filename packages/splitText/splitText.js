// Hypothesis: A word consists of non-space characters, followed by space characters.
// Use a positive lookbehind to combine this logic with split().
var splitIntoWords = (text) => text.split(/(?<=\S+\s+)/);

/**
 * Wraps a single letter within the wrapLetter function provided.
 *
 * @param {string} text                 Text to be wrapped.
 * @param {function} wrapLetter         Function to wrap each letter with; takes two arguments,
 *                                      letter (string) and index (int) and is expected to return a
 *                                      string, e.g.
 *                                      wrapLetter = (letter, index) => `
 *                                      <span data-index="${index}">${letter}</span>`.
 * @param {int=0} startIndex            The index to start with when calling wrapLetter
 * @param {string=false} replaceSpaces  The string to replace spaces (regex \s) with; needed as
 *                                      to preserve spaces in a text, we must use &nbsp; within
 *                                      elements.
 */
var wrapLetters = (text, wrapLetter, startIndex = 0, replaceSpaces = false) => {

    let index = startIndex;

    // Wrap every single letter within the current part
    const wrapped = text
        .split('')
        .map((letter) => {
            const adjustedLetter = replaceSpaces && letter.match(/\s/) ? replaceSpaces : letter;
            const lettered = wrapLetter(adjustedLetter, index);
            index++;
            return lettered;
        })
        .join('');

    return { index, result: wrapped };

};

/**
 * Splits text in a HTML element into lines and wraps them with the function provided. It is
 * mandatory that all childNodes of the HTML element are HTMLElements (not bare text, comments or
 * other node types).
 */
var wrapLines = (element, wrapLine) => {

    const elementOffsets = new Map();

    // If wrapLetters is set, every childNode will be a child (HTMLElement) – there's no need
    // to wrap them in an additional HTMLElement as they will not be raw text nodes.
    for (const child of element.children) {
        const { top } = child.getBoundingClientRect();
        if (!elementOffsets.has(top)) elementOffsets.set(top, []);
        elementOffsets.get(top).push(child);
    }

    const wrappedInLines = Array.from(elementOffsets.values())
        .map((content, index) => {
            const lineAsHTML = content.map((html) => html.outerHTML).join('');
            return wrapLine(lineAsHTML, index);
        })
        .join('');

    return wrappedInLines;

};

/* global HTMLElement */


/**
 * Splits content of a single HTML element into multiple sub-elements. Does all the 'footwork' for
 * splitText and implements its basic functionality.
*/
var splitTextContent = ({
    element,
    wrapLetter = (content, index) => `<span data-letter-index="${index}" class="letter">${content}</span>`,
    wrapWord = (content, index) => `<span data-word-index="${index}" class="word">${content}</span>`,
    wrapLine = (content, index) => `<span data-line-index="${index}" class="line">${content}</span>`,
} = {}) => {
    if (!(element instanceof HTMLElement)) {
        throw new Error(`SplitTextContent: argument element must be of type HTMLElement, is ${element} instead.`);
    }
    if (wrapLetter !== false && typeof wrapLetter !== 'function') {
        throw new Error(`SplitTextContent: argument wrapLetter must be false or a functions, is ${wrapLetter} instead.`);
    }
    if (wrapWord !== false && typeof wrapWord !== 'function') {
        throw new Error(`SplitTextContent: argument wrapWord must be false or a functions, is ${wrapWord} instead.`);
    }
    if (wrapLine !== false && typeof wrapLine !== 'function') {
        throw new Error(`SplitTextContent: argument wrapLine must be false or a functions, is ${wrapLine} instead.`);
    }

    const { textContent } = element;

    // In HTML, spaces may occur before and after a string, but they won't be displayed in the
    // browser. Remove those.
    const trimmed = textContent.trim();

    const indices = {
        word: 0,
        letter: 0,
        line: 0,
    };

    // Wrap every word first as we must split at word boundaries which are hard to detect
    // if we split at letters first.
    const wrappedInLettersAndWords = splitIntoWords(trimmed)
        .map((part) => {

            // Wrap single part into letters if wrapLetter is set
            let wrappedInLetters = part;
            if (wrapLetter) {
                const { result, index } = wrapLetters(part, wrapLetter, indices.letter, '&nbsp;');
                indices.letter = index;
                wrappedInLetters = result;
            }

            let wrapedInWords = wrappedInLetters;
            if (wrapWord) {
                // If content was not wrapped into letters, spaces won't be converted to &nbsp;
                // therefore, this has to be done here or spaces will disappear (when they
                // are the last character in an element).
                if (!wrapLetter) {
                    wrappedInLetters = wrappedInLetters.replace(/\s$/g, '&nbsp;');
                }
                wrapedInWords = wrapWord(wrappedInLetters, indices.word);
                indices.word++;
            }

            return wrapedInWords;

        })
        .join('');

    element.innerHTML = wrappedInLettersAndWords;

    // Wrap lines
    let wrappedInLines = wrappedInLettersAndWords;
    if (wrapLine) wrappedInLines = wrapLines(element, wrapLine);

    element.innerHTML = wrappedInLines;

};

/**
 * Simple debounce implementation. See README.
*/
var debounce = (callback, offset) => {
    let timeout;
    return () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(callback, offset);
    };
};

/* global HTMLElement, window */


/**
 * Provides a simple interface to split the textContent of a HTML element into single blocks where
 * every block represents a letter, a word or a line. Updates blocks on resize.
 */
var splitText = ({
    updateOnResize = true,
    element,
    wrapLetter,
    wrapWord,
    wrapLine,
} = {}) => {
    if (!(element instanceof HTMLElement)) {
        throw new Error(`SplitText: argument element must be of type HTMLElement, is ${element} instead.`);
    }

    const originalContent = element.innerHTML;

    // Only restore on resize if textContent is split
    let wasSplit = false;

    const split = () => {
        splitTextContent({
            element,
            wrapLetter,
            wrapWord,
            wrapLine,
        });
        wasSplit = true;
    };

    const restore = () => {
        element.innerHTML = originalContent;
        wasSplit = false;
    };

    if (updateOnResize) {
        const debouncedUpdate = debounce(split, 500);
        window.addEventListener('resize', () => {
            if (wasSplit) restore();
            debouncedUpdate();
        });
    }

    split();

    // Return restore function
    return restore;

};

export { splitText as default };
