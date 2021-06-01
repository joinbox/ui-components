import MediaTimelineComponent from './MediaTimelineComponent.js';

/* global window */
if (!window.customElements.get('media-timeline-component')) {
    window.customElements.define('media-timeline-component', MediaTimelineComponent);
}
