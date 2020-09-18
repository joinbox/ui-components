import AudioModel from './AudioModel.js';
import canRegisterElements from '../shared/canRegisterElements.js';
import getAndValidateAttribute from '../shared/getAndValidateAttribute.mjs';

/* global HTMLElement, requestAnimationFrame */

export default class AudioComponent extends HTMLElement {

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
     * Update DOM when relevant events happen on the model
     * @private
     */
    setupModelListeners() {
        this.audioModel.on('canplaythrough', this.updateDOM.bind(this));
        this.audioModel.on('play', this.updateDOM.bind(this));
        this.audioModel.on('load', this.updateDOM.bind(this));
        this.audioModel.on('pause', this.updateDOM.bind(this));
    }

    /**
     * Listen to child components as soon as element is added to the DOM
     */
    connectedCallback() {
        this.registerAnnouncements();
        // Update state to match model's state
        this.updateDOM();
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

    /**
     * Calculates UI state from model's states.
     * @returns {string}
     * @private
     */
    calculateState() {
        // Usually, wile loading state is *also* playing. Therefore test loading first.
        if (this.audioModel.loadingState === 'loading') return 'loading';
        if (this.audioModel.playing) return 'playing';
        // Not playing but loaded: must be paused
        if (this.audioModel.loadingState === 'loaded') return 'paused';
        // Default state: User has not interacted
        return 'initialized';
    }

    /**
     * Update data-state. Set it at one single place for the whole component (not distributed
     * over different child elements).
     * @private
     */
    updateDOM() {
        requestAnimationFrame(() => {
            this.dataset.state = this.calculateState();
        });
    }

}
