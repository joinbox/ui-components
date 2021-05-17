/* global document, fetch */

/**
 * Fetches a url, converts it to a DOM
 */
export default async(url) => {
    const rawContent = await fetch(url);
    const content = await rawContent.text();
    const doc = document.createElement('html');
    doc.innerHTML = content;
    return doc;
};
