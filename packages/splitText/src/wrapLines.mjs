/**
 * Splits text in a HTML element into lines and wraps them with the function provided. It is
 * mandatory that all childNodes of the HTML element are HTMLElements (not bare text, comments or
 * other node types).
 */
export default (element, wrapLine) => {

    const elementOffsets = new Map();

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
