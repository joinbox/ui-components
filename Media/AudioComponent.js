import AudioModel from './AudioModel.js';
import canRegisterElements from '../shared/canRegisterElements.js';
import getAndValidateAttribute from '../shared/getAndValidateAttribute.mjs';

/* global HTMLElement, window */

class AudioComponent extends HTMLElement {

    constructor() {
        super();
        this.audioModel = new AudioModel();
        Object.assign(this, canRegisterElements({
            eventTarget: this,
            model: this.audioModel,
        }));
        // Audio can be played from different sub-components; set URL instantly so that they
        // can start interacting
        this.audioModel.setURL(this.getAudioURL());
        this.setupModelListeners();
    }

    /**
     * Set ready class on element as soon as audio is ready
     */
    setupModelListeners() {
        this.audioModel.on('canplaythrough', () => this.updateDOM(true));
    }

    /**
     * Listen to child components as soon as element is added to the DOM
     */
    connectedCallback() {
        this.registerAnnouncements();
    }

    /**
     * Returns audio URL that is stored in element's data-source attribute.
     * @private
     */
    getAudioURL() {
        return getAndValidateAttribute({
            element: this,
            name: 'data-source',
            validate: value => value && typeof value === 'string',
        });
    }

    updateDOM(ready) {
        if (ready) {
            const readyClassName = getAndValidateAttribute({
                element: this,
                name: 'data-ready-class',
            });
            this.classList.add(readyClassName);
        }
    }

}

window.customElements.define('audio-component', AudioComponent);
