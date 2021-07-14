import VimeoPreviewImage from './VimeoPreviewImage.js';

/* global window */
if (!window.customElements.get('vimeo-preview-image')) {
    window.customElements.define('vimeo-preview-image', VimeoPreviewImage);
}
