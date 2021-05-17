/* global window, document */

/**
 * Loads YouTube API and returns Player or only returns Player if it is already loaded.
 */
export default async() => {

    const youTubeScriptURL = 'https://www.youtube.com/iframe_api';

    // YouTube script was already loaded, Player is ready
    if (window.YT && window.YT.Player && typeof window.YT.Player === 'function') {
        return Promise.resolve(window.YT.Player);
    };

    // Check if there is already a YouTube script: If there is, just wait until it's done
    const existingTag = document.querySelector(`script[src="${youTubeScriptURL}"]`);

    // There is no script tag: Create and add it to the DOM
    if (!existingTag) {
        const tag = document.createElement('script');
        tag.setAttribute('src', youTubeScriptURL);
        document.body.appendChild(tag);
    }

    return new Promise((resolve) => {
        window.onYouTubeIframeAPIReady = () => resolve(window.YT.Player);
    });

};
