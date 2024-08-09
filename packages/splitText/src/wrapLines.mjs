/* global Symbol */
/**
 * Splits text in a HTML element into lines and wraps them with the function provided. It is
 * mandatory that all childNodes of the HTML element are HTMLElements (not bare text, comments or
 * other node types).
 */
export default (element, wrapLine) => {

    // If there are no children (because the content is not wrapped in letters nor words), just
    // return one line: We cannot measure the y position of children that don't exist
    const { childNodes } = element;

    // 1 = ElementNode
    const isBreak = (htmlElement) => htmlElement.nodeType === 1 && htmlElement.tagName === 'BR';

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

    // If a *text* node (those are especially spaces between words/letters) lies between two
    // *elements* with the same top, add them to the same line (by adjusting its top; as
    // they cannot be measured and return a top of null).
    // If not, keep top of null.
    // Elements with top of null will not be wrapped with wrapLine function.
    const adjustedTops = childrenWithTop.map((child, index) => {
        if (
            // 3 = TextNode
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
        // Use Symbol() to make sure the br gets its very own line; we could also use Math.random();
        // <br> should never be wrapped, see below
        if (isBreak(child.content)) previous.push([Symbol('brTop'), child.content]);
        else if (child.top === previous.at(-1)?.at(0)) previous.at(-1).push(child.content);
        else previous.push([child.top, child.content]);
        return previous;
    }, []);

    // Wrap the relevant elements on the same line with wrapLine function
    let lineIndex = 0;
    const wrapped = lines.map((allContent) => {
        // Remove the first entry which is the top
        const content = allContent.slice(1);
        // Spaces are text nodes on their own line. As they should never be wrapped into an
        // element; output their content as is.
        if (content.length === 1 && content[0].nodeType === 3) return content[0].textContent;
        // Handle single <br> elements just as we handle regular spaces above: don't wrap anyhting
        // around them. Why? Within a wrapped element, the <br> won't break
        // the line correcly any more: <br/><br/> is not equal to
        // <span><br/></span><span><br/></span> (which will swallow breaks).
        else if (content.length === 1 && isBreak(content[0])) return content[0].outerHTML;
        else {
            const contents = content.map((contentItem) => (
                // 3 = TextNode
                contentItem.nodeType === 3 ? contentItem.textContent : contentItem.outerHTML
            ));
            const result = wrapLine(contents.join(''), lineIndex);
            lineIndex += 1;
            return result;
        }
    });

    return wrapped.join('');

};
