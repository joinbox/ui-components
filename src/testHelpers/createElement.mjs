/**
 * Creates HTMLElements from provided HTML string
 */
export default ({ document, html } = {}) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};
