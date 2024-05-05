/**
 * Simply awaits two requestAnimationFrame calls to ensure that splitText has been executed
 * (which requires 2 rAF, see splitTextContent.mjs)
 * @param {window} window   Window object of the JSDOM instance
 */
export default (window) => (
    new Promise(
        (resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)),
    )
);
