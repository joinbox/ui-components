// Break words at spaces and dashes.
// Why a dashes? If we don't, long words connected by dashes (especially in German) will blow
// the layout as lines become longer than the layout might be wide.
export default (text) => {
    // This splits text into words and whatever's inbetween; 'hello-world there' becomes
    // ['hello', '-', 'world', ' ', 'there']
    // Parens are necessary to include the boundaries in the result
    const boundaryRegex = /([\s-]+)/g;
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

