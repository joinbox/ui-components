/**
 * Loads Vimeo API if needed and else returns the Player object
 */
export default async() => {
    /* global window, document */
    const url = 'https://player.vimeo.com/api/player.js';
    if (window.Vimeo && window.Vimeo.Player) return Promise.resolve(window.Vimeo.Player);

    // If there is already a script tag with the corresponding URL, re-use it
    let scriptTag = document.querySelector(`script[src="${url}"]`);
    return new Promise((resolve, reject) => {
        // If there is no script tag, create it
        if (!scriptTag) {
            scriptTag = document.createElement('script');
        }
        scriptTag.addEventListener('load', () => resolve(window.Vimeo.Player));
        scriptTag.addEventListener(
            'error',
            () => reject(new Error('Vimeo script could not be loaded'))
        );
        // If scriptTag was newly created, we must append it to the body
        if (!scriptTag.closest('body')) {
            scriptTag.setAttribute('src', url);
            document.body.appendChild(scriptTag);
        }
    });

}