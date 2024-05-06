// Break words at spaces and dashes.
// Why a dashes? If we don't, long words connected by dashes (especially in German) will blow
// the layout as lines become longer than the layout might be wide.
var splitIntoWords = (text) => {
    // This splits text into words and whatever's inbetween; 'hello-world there' becomes
    // ['hello', '-', 'world', ' ', 'there']
    // Without the parens, the parts of the string that match the regex would be excluded from
    // the result; use the parens to include them (i.e. all spaces and dashes).
    // Table with dashes: see https://www.compart.com/en/unicode/category/Pd
    // Don't use en-/em-dashes as boundary because they might be on the upper or lower line when
    // they're at the end of a line break (and they're usually set with a space between the
    // surrounding words)
    const boundaryRegex = /([\s-‐‒﹣－]+)/g;
    // Remove all empty parts that might be added by using split
    const textSplitAtBoundaries = text.split(boundaryRegex).filter((part) => part !== '');
    const words = [];
    textSplitAtBoundaries.forEach((part, index) => {
        const isBoundary = boundaryRegex.test(part);
        if (index === 0) words.push([part]);
        // If the string starts with a boundary, exceptionally add the word after it to the
        // previous boundary; if we don't, the first word would consist of the boundary only.
        else if (index === 1 && !isBoundary) words.at(-1).push(part);
        // Add boundaries to the previous word
        else if (isBoundary) words.at(-1).push(part);
        // Start a new word
        else words.push([part]);
    });
    return words.map((parts) => parts.join(''));


};

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
var wrapLetters = (text, wrapLetter, startIndex = 0) => {

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

/**
 * Splits text in a HTML element into lines and wraps them with the function provided. It is
 * mandatory that all childNodes of the HTML element are HTMLElements (not bare text, comments or
 * other node types).
 */
var wrapLines = (element, wrapLine) => {

    // If there are no children (because the content is not wrapped in letters nor words), just
    // return one line: We cannot measure the y position of children that don't exist
    const { childNodes } = element;

    const childElements = [...childNodes].filter((node) => node.nodeType === 1);
    if (!childElements.length) {
        console.warn('In order for wrapLine to work, you must also apply wrapWord.');
        return wrapLine(element.innerHTML, 0);
    }

    // Get top of all child elements; use null for text
    const childrenWithTop = [...childNodes].map((child) => ({
        content: child,
        top: child.nodeType === 1 ? child.getBoundingClientRect().top : null,
    }));

    // If a *text* node lies between two *elements* with the same top, add them to the same line
    // (by adjusting its top); if not, keep top of null. Elements with top of null will not be
    // wrapped with wrapLine function.
    const adjustedTops = childrenWithTop.map((child, index) => {
        if (
            child.content.nodeType === 3
            && (childrenWithTop[index - 1]?.top === childrenWithTop[index + 1]?.top)
        ) {
            return { ...child, top: childrenWithTop[index - 1].top };
        } else return child;
    });

    // Group children by top; use a funny data structure here: An array of arrays, where the first
    // item is the top and all following elements are the children with that top; this allows
    // us to easily access the latest element (which is harder with Maps or objects)
    const lines = adjustedTops.reduce((previous, child) => {
        if (child.top === previous.at(-1)?.at(0)) previous.at(-1).push(child.content);
        else previous.push([child.top, child.content]);
        return previous;
    }, []);

    // Wrap all elements on the same line (except for spaces at their beginning or end) with
    // wrapLine function
    let lineIndex = 0;
    const wrapped = lines.map(([top, ...content]) => {
        // A child is a text element if there's only one of them and the top is 0
        if (content.length === 1 && top === null) return content[0].textContent;
        else {
            const contents = content.map((contentItem) => (
                contentItem.nodeType === 3 ? contentItem.textContent : contentItem.outerHTML
            ));
            const result = wrapLine(contents.join(''), lineIndex);
            lineIndex += 1;
            return result;
        }
    });

    return wrapped.join('');

};

/**
 * Splits a HTML string into an array of objects where every entry represents either a tag
 * or a text node.
 */
var splitTags = (htmlString) => (
    htmlString
        .split(/(<[^>]+>)/)
        .map((part) => ({
            type: part.startsWith('<') ? 'tag' : 'text',
            value: part,
        }))
        // If htmlString a) starts or b) ends with a tag or if c) two tags follow each other,
        // there will be an unnecessary empty text a) before, b) after of c) between the tags.
        // Remove it. It should be safe to remove all empty text nodes.
        .filter(({ value, type }) => value !== '' || type !== 'text')
);

/* global HTMLElement, window */


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
                    // Make sure to not wrap spaces into a word; they should stay outside of the
                    // word element (see introductory comment)
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

/* global window */

/**
 * Calls callback with a debounce of 500ms if the window size for one of the axes provided has
 * changed.
 * @param {Object} options
 * @param {string[]} options.axes - ['x'], ['y'], ['x', 'y'] or []
 */
var watchResize = ({ axes, callback } = {}) => {
    const getWindowSize = () => ({
        x: window.innerWidth,
        y: window.innerHeight,
    });
    let previousWindowSize = getWindowSize();
    const handleResize = () => {
        const { x, y } = getWindowSize();
        const xChanged = previousWindowSize.x !== x;
        const yChanged = previousWindowSize.y !== y;
        previousWindowSize = { x, y };
        const relevantChange = (xChanged && axes.includes('x')) || (yChanged && axes.includes('y'));
        if (relevantChange) callback();
    };
    window.addEventListener('resize', handleResize);
};

/**
 * Valid arguments for resize axes are ['x'], ['y'] or true, false or ['x', 'y']. Convert those
 * to an array of axes ['x', 'y'].
 * @param {boolean|string[]} axes
 * @returns {string[]}
 */
var normalizeScrollAxes = (axes) => {
    const allAxes = ['x', 'y'];
    const resizeAxes = [];
    if (axes === true) resizeAxes.push(...allAxes);
    else if (Array.isArray(axes)) {
        axes.forEach((axis) => {
            if (!allAxes.includes(axis)) {
                console.warn('Axis %o is not supported; use one of \'x\' or \'y\'.', axes);
            } else {
                resizeAxes.push(axis);
            }
        });
    } else if (axes !== false) {
        throw new Error(`Invalid argument for axes; use true, false or an array of axes ('x'/'y'); you passed ${JSON.stringify(axes)} instead.`);
    }
    return resizeAxes;
};

/* global HTMLElement */


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

    const debouncedSplit = debounce(split, 500);
    if (updateOnResize) {
        watchResize({
            axes: normalizeScrollAxes(updateOnResize),
            callback: () => {
                if (wasSplit) restore();
                debouncedSplit();
            },
        });
    }

    split();

    // Return restore function
    return restore;

};

export { splitText as default };
