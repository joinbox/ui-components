import YouTubePlayer from './YouTubePlayer.js';

/* global window */
if (!window.customElements.get('youtube-player-component')) {
    window.customElements.define('youtube-player-component', YouTubePlayer);
}
