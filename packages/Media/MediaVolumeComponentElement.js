import MediaVolumeComponent from './MediaVolumeComponent.js';

/* global window */
if (!window.customElements.get('media-volume-component')) {
    window.customElements.define('media-volume-component', MediaVolumeComponent);
}
