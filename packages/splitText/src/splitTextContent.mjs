/* global HTMLElement, window */

import splitIntoWords from './splitIntoWords.mjs';
import wrapLetters from './wrapLetters.mjs';
import wrapLines from './wrapLines.mjs';
import splitTags from './splitTags.mjs';

/**
 * Splits content of a single HTML element into multiple sub-elements. Does all the 'footwork' for
 * splitText and implements its basic functionality.
 *
 * A word on spaces: We keep them as they are without wrapping them. Because:
 * - If we wrap a regular space into a div with display:inline-block, it will be removed
 *   during rendering
 * - If we replace that space with a &nbsp;, the spaces are not collapsed
 * - If we use another fancy solution, <pre> or whitespace:pre-wrap won't work
*/
export default ({
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

    // In HTML, spaces may occur before and after a string, but they won't be displayed in the
    // browser. Remove those as every single one would be wrapped in a letter span (if
    // wrapLetter is set) and take their place.
    // Trim at the very beginning and very end of innerHTML only; never trim between text/tags
    // as this would lead to links that stick to their surrounding text.
    const parts = splitTags(element.innerHTML);

    /**
     * Wraps letters and/or words of a text node according to settings
     * @param {string} text - The text to be wrapped.
     * @param {{letter: number, word: number, line: number}} indices - Current index for the
     * different levels of parts that we might process.
     * @returns {string} The wrapped text, containing HTML elements for letters and/or words.
     */
    const processText = (text, indices) => (
        // Wrap words first as we must split at word boundaries which are hard to detect
        // if we split at letters first.
        splitIntoWords(text)
            // Variable is called part (and not word) because we won't split into words if
            // wrapWord is false
            .map((part) => {
                // If part is a space or newline, don't wrap it at all; this happens if a space
                // or newline stands e.g. between two tags: <br> <br>
                if (part.match(/^\s+$/)) return part;

                // Wrap single part into letters if wrapLetter is set
                let wrappedInLetters = part;
                if (wrapLetter) {
                    const { result, index } = wrapLetters(part, wrapLetter, indices.letter);
                    // eslint-disable-next-line no-param-reassign
                    indices.letter = index;
                    wrappedInLetters = result;
                }

                let wrappedInWords = wrappedInLetters;
                if (wrapWord) {
                    // Make sure to not wrap spaces or newlines into a word; they should stay
                    // outside of the word element (see introductory comment)
                    wrappedInWords = wrappedInWords.replace(
                        // Use non-greedy matcher for content (middle) part; if we use a regular
                        // matcher, it will also match the spaces at the end
                        /^(\s*)(.*?)(\s*)$/,
                        (matches, introSpaces, content, outroSpaces) => (
                            `${introSpaces}${wrapWord(content, indices.word)}${outroSpaces}`
                        ),
                    );
                    // eslint-disable-next-line no-param-reassign
                    indices.word += 1;
                }

                return wrappedInWords;

            })
            .join('')
    );

    // Take track of the current indices for every type of wrapping; as they should be
    // continuous throughout the whole content, we must persist them across all parts.
    // Therefore we put them in a "global" scope.
    const indices = {
        word: 0,
        letter: 0,
        line: 0,
    };

    // Go through all tags/texts and wrap text according to settings
    const processedParts = parts.map((part) => {
        // Tags should not be modified at all
        if (part.type === 'tag') return part.value;
        else return processText(part.value, indices);
    });

    const wrappedInLettersAndWords = processedParts.join('');

    // In order to wrap lines, we must update the original element in order to measure the y
    // positions of its children.

    window.requestAnimationFrame(() => {
        // eslint-disable-next-line no-param-reassign
        element.innerHTML = wrappedInLettersAndWords;

        // Wrap lines
        const wrappedInLines = wrapLine ? wrapLines(element, wrapLine) : wrappedInLettersAndWords;

        window.requestAnimationFrame(() => {
            // eslint-disable-next-line no-param-reassign
            element.innerHTML = wrappedInLines;
        });

    });


};
