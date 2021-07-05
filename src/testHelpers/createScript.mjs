/**
 * Creates a valid script element and appends it to the parent element
 */
export default ({ content, document } = {}) => {
    const script = document.createElement('script');
    const contentNode = document.createTextNode(content);
    script.appendChild(contentNode);
    document.body.appendChild(script);
};
