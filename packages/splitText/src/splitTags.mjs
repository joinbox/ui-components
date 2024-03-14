/**
 * Splits a HTML string into an array of objects where every entry represents either a tag
 * or a text node.
 */
export default (htmlString) => (
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
