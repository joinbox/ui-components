import MediaPlayPauseComponent from './MediaPlayPauseComponent.js';

/* global window */
if (!window.customElements.get('media-play-pause-component')) {
    window.customElements.define('media-play-pause-component', MediaPlayPauseComponent);
}
