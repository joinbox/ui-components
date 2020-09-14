export default (element, name, callback) => {
    const attributeName = `data-initialized-${name}`;
    if (element.hasAttribute(attributeName)) return;
    // We're not using requestAnimationFrame here in case once is called multiple times in short
    // successtion; if we used requestAnimationFrame, the DOM might not be up to date when we
    // read the element's attributeName, it would return an old/previous value.
    element.setAttribute(attributeName, 'true');
    callback();
};
