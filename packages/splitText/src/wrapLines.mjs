/**
 * Splits text in a HTML element into lines and wraps them with the function provided. It is
 * mandatory that all childNodes of the HTML element are HTMLElements (not bare text, comments or
 * other node types).
 */
export default (element, wrapLine) => {

    const elementOffsets = new Map();

    // If there are no children (because the content is not wrapped in letters nor words), just
    // return one line: We cannot measure the y position of children that don't exist
    const { children } = element;

    if (!children.length) {
        console.warn('In order for wrapLine to work, you must also apply wrapWord.');
        return wrapLine(element.innerHTML, 0);
    }

    // If wrapLetters is set, every childNode will be a child (HTMLElement) – there's no need
    // to wrap them in an additional HTMLElement as they will not be raw text nodes.
    for (const child of children) {
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
