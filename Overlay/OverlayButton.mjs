// import overlayEvents from './overlayEvents.mjs';
const overlayEvents = new Map([
    ['openOverlay', 'openoverlay'],
    ['closeOverlay', 'closeoverlay'],
]);

/**
 * Button that opens or closes an overlay (by emitting an open/closeoverlay event). Requires
 * attributes data-button-type (open/close) and data-overlay-name.
 */
class OverlayButton extends window.HTMLElement {

    /* Use window prefix on all HTML APIs to simplify JSDOM testing */
    /* global window */

    constructor() {
        super();
        // Validate attributes at this stage to be able to catch errors early (and not async on
        // user interactions).
        this.getAndValidateOverlayName();
        this.getAndValidateButtonType();
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
        const { overlayName } = this.dataset;
        if (!overlayName) {
            throw new Error(`OverlayButton: You must provide a HTML attribute called data-overlay-name in order for the OverlayButton to work; it needs to be identical to the data-overlay-name attribute of the corresponding overlay. You passed ${overlayName} instead.`);
        }
        return overlayName;
    }

    /**
     * @private
     */
    getAndValidateButtonType() {
        const { buttonType } = this.dataset;
        const validTypes = ['open', 'close'];
        if (!buttonType || !validTypes.includes(buttonType)) {
            throw new Error(`OverlayButton: You must provide a HTML attribute called data-button-type which is either 'open' or 'close'; you passed ${buttonType} instead.`);
        }
        return buttonType;
    }

}

window.customElements.define('jb-overlay-button', OverlayButton);

export default OverlayButton;
