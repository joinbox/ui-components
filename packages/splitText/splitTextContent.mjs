import wrapLetters from './wrapLetters.mjs';
import wrapLines from './wrapLines.mjs';

/**
 * Splits content of a single HTML element into multiple sub-elements. Does all the 'footwork' for
 * splitText and implements its basic functionality.
*/
export default({
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

    const indices = {
        word: 0,
        letter: 0,
        line: 0,
    };

    const wrappedInLettersAndWords = textContent
        // Wrap every word first as we must split at word boundaries which are hard to detect
        // if we split at letters first.
        .split(/\b/g)
        .map((part) => {

            // Wrap single part into letters if wrapLetter is set
            let wrappedInLetters = part;
            if (wrapLetter) {
                const { result, index } = wrapLetters(part, wrapLetter, indices.letter);
                indices.letter = index;
                wrappedInLetters = result;
            }

            // If current part is a word-like thing (and if wrapWord was provided), wrap it with
            // wrapWord; if it is not, use original
            let wrapedInWords = wrappedInLetters;
            if (/^\w+$/.test(part) && wrapWord) {
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
