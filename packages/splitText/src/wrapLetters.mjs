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
 */
export default (text, wrapLetter, startIndex = 0) => {

    let index = startIndex;

    // Wrap every single letter within the current part
    const wrappedLetters = text
        // Split at every letter, but keep HTML entities as one pseudo-character together
        .split(/(&[^;]+;|)/)
        // The split RegEx above returns the dividers as well (as we need to keep the HTML
        // entities); this includes empty strings (for all regular splits happening between
        // letters); filter them out as they're superfluous and would be wrapped as well.
        .filter((letter) => letter !== '')
        .map((letter) => {
            // Never wrap spaces (see splitTextContent.js); and don't count index up on them
            const isSpace = letter.match(/\s/);
            if (isSpace) return letter;
            else {
                const wrappedLetter = wrapLetter(letter, index);
                index++;
                return wrappedLetter;
            }
        })
        .join('');

    return { index, result: wrappedLetters };
};

