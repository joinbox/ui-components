/**
 * Splits text in a HTML element into lines and wraps them with the function provided. It is
 * mandatory that all childNodes of the HTML element are HTMLElements (not bare text, comments or
 * other node types).
 */
export default (element, wrapLine) => {

    const elementOffsets = new Map();

    // If wrapLetters is set, every childNode will be a children (HTMLElement) – there's no need
    // to wrap them in an additional HTMLElement as they will not be raw text nodes.
    for (const child of element.children) {
        const { top } = child.getBoundingClientRect();
        if (!elementOffsets.has(top)) elementOffsets.set(top, []);
        elementOffsets.get(top).push(child);
    }

    const wrappedInLines = Array.from(elementOffsets.values())
        .map((content, index) => {
            const lineAsHTML = content.map(html => html.outerHTML).join('');
            return wrapLine(lineAsHTML, index);
        })
        .join('');

    return wrappedInLines;

};
