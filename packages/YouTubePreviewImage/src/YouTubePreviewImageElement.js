import YouTubePreviewImage from './YouTubePreviewImage.js';

/* global window */
if (!window.customElements.get('youtube-preview-image')) {
    window.customElements.define('youtube-preview-image', YouTubePreviewImage);
}
