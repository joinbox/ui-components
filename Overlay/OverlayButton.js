import getAndValidateAttribute from '../shared/getAndValidateAttribute.mjs';
import overlayEvents from './overlayEvents.js';

/**
 * Button that opens or closes an overlay (by emitting an open/closeoverlay event). Requires
 * attributes data-button-type (open/close) and data-overlay-name.
 */
export default class OverlayButton extends window.HTMLElement {

    /* global window */

    constructor() {
        super();
        this.setupClickListener();
    }

    /**
     * @private
     */
    setupClickListener() {
        this.addEventListener('click', this.fireOverlayEvent.bind(this));
    }

    /**
     * @private
     * @fires      openoverlay or closeoverlay (depending on data-button-type) with overlayName
     *             as detail.
     */
    fireOverlayEvent() {
        const overlayName = this.getAndValidateOverlayName();
        const buttonType = this.getAndValidateButtonType();
        const options = {
            detail: { overlayName },
            bubbles: true,
        };
        const eventName = `${buttonType}Overlay`;
        const event = new window.CustomEvent(overlayEvents.get(eventName), options);
        this.dispatchEvent(event);
    }

    /**
     * @private
     */
    getAndValidateOverlayName() {
        return getAndValidateAttribute({
            name: 'data-overlay-name',
            validate: value => !!value,
            errorMessage: 'must be a non-empty string',
            element: this,
        });
    }

    /**
     * @private
     */
    getAndValidateButtonType() {
        return getAndValidateAttribute({
            name: 'data-button-type',
            validate: value => !!value,
            errorMessage: 'must be a non-empty string',
            element: this,
        });
    }

}
