import VimeoPlayer from './VimeoPlayer.js';

/* global window */
if (!window.customElements.get('vimeo-player')) {
    window.customElements.define('vimeo-player', VimeoPlayer);
}
