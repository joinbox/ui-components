import overlayEvents from './overlayEvents.mjs';
import getAndValidateAttribute from '../shared/getAndValidateAttribute.mjs';

/**
 * Overlay that is opened/closed by open/closeoverlay events. Optionally closes on esc or
 * click outside and always locks background (prevents scrolling).
 */
class Overlay extends window.HTMLElement {

    /* Use window prefix on all HTML APIs to simplify JSDOM testing */
    /* global window */

    constructor() {
        super();
        // Validate attributes at this stage to be able to catch errors early (and not async on
        // user interactions).
        this.getAndValidateOverlayName();
        // Store bound open function; we need the reference to de-register when component is
        // disconnected from dom
        this.boundOpen = this.open.bind(this);
        this.boundClose = this.close.bind(this);
    }

    connectedCallback() {
        window.addEventListener(overlayEvents.get('openOverlay'), this.boundOpen);
        window.addEventListener(overlayEvents.get('closeOverlay'), this.boundClose);
        this.setupEscListener();
    }

    disconnectedCallback() {
        window.removeEventListener(overlayEvents.get('openOverlay'), this.boundOpen);
        window.removeEventListener(overlayEvents.get('closeOverlay'), this.boundClose);
    }

    open() {
        window.requestAnimationFrame(() =>
            this.classList.add(this.getAndValidateVisibleClassName()));
    }

    close() {
        window.requestAnimationFrame(() =>
            this.classList.add(this.getAndValidateVisibleClassName()));
    }

    /**
     * @private
     */
    setupEscListener() {
        const closeOnEsc = getAndValidateAttribute({
            name: 'data-disable-esc',
            isSet: true,
            element: this,
        });
        if (!closeOnEsc) return;
        window.addEventListener('keydown', (ev) => {
            console.log(ev);
        });
    }

    /**
     * @private
     */
    getAndValidateVisibleClassName() {
        return getAndValidateAttribute({
            name: 'data-visible-class',
            validate: value => !!value,
            errorMessage: 'must be a non-empty string',
            element: this,
        });
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

}

window.customElements.define('jb-overlay', Overlay);

