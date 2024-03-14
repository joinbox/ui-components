/* global HTMLElement */

import splitIntoWords from './splitIntoWords.mjs';
import wrapLetters from './wrapLetters.mjs';
import wrapLines from './wrapLines.mjs';
import splitTags from './splitTags.mjs';

/**
 * Splits content of a single HTML element into multiple sub-elements. Does all the 'footwork' for
 * splitText and implements its basic functionality.
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

    const parts = splitTags(element.innerHTML);

    /**
     * Wraps letters and/or words of a text node according to settings
     * @param {string} text - The text to be wrapped
     * @returns {string} The wrapped text, containing HTML elements for letters and/or words
     */
    const processText = (text, indices) => {
        // In HTML, spaces may occur before and after a string, but they won't be displayed in the
        // browser. Remove those as every single one would be wrapped in a letter span (if
        // wrapLetter is set) and take their place.
        const trimmedText = text.trim();

        // Wrap words first as we must split at word boundaries which are hard to detect
        // if we split at letters first.
        return splitIntoWords(trimmedText)
            // Variable is called part (and not word) because we won't split into words if
            // wrapWord is false
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
    };

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

    // eslint-disable-next-line no-param-reassign
    element.innerHTML = wrappedInLettersAndWords;

    // Wrap lines
    const wrappedInLines = wrapLine ? wrapLines(element, wrapLine) : wrappedInLettersAndWords;

    // eslint-disable-next-line no-param-reassign
    element.innerHTML = wrappedInLines;

};
