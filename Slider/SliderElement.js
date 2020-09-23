import Slider from './Slider.js';

/* global window */
if (!window.customElements.get('slider-component')) {
    window.customElements.define('slider-component', Slider);
}
