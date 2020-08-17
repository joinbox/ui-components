import { disableBodyScroll, enableBodyScroll } from '../node_modules/body-scroll-lock/lib/bodyScrollLock.es6.js';
import overlayEvents from './overlayEvents.js';
import getAndValidateAttribute from '../shared/getAndValidateAttribute.mjs';
import createListener from '../shared/createListener.mjs';

/**
 * Overlay that is opened/closed by open/closeoverlay events. Optionally closes on esc or
 * click outside and always locks background (prevents scrolling).
 */
export default class Overlay extends window.HTMLElement {

    /**
     * Holds open state; should only be accessed through getter isOpen and modified through
     * open/close.
     * @private
     */
    internalIsOpen = false;

    /* global window */

    constructor() {
        super();
        // Store bound open function; we need the reference to de-register when component is
        // disconnected from dom
        this.boundHandleEscEvent = this.handleEscEvent.bind(this);
        this.boundHandleClickOutsideEvent = this.handleClickOutsideEvent.bind(this);
    }

    connectedCallback() {
        this.disconnectHandleOpenEvent = createListener(
            window,
            overlayEvents.get('openOverlay'),
            this.handleOpenEvent.bind(this),
        );
        this.disconnectHandleCloseEvent = createListener(
            window,
            overlayEvents.get('closeOverlay'),
            this.handleCloseEvent.bind(this),
        );
    }

    disconnectedCallback() {
        this.disconnectHandleOpenEvent();
        this.disconnectHandleCloseEvent();
    }

    /**
     * @private
     */
    setupEscListener() {
        window.addEventListener('keydown', this.boundHandleEscEvent);
    }

    /**
     * @private
     */
    teardownEscListener() {
        window.removeEventListener('keydown', this.boundHandleEscEvent);
    }

    /**
     * @private
     */
    setupClickOutsideListener() {
        window.addEventListener('click', this.boundHandleClickOutsideEvent);
    }

    /**
     * @private
     */
    teardownClickOutsideListener() {
        window.removeEventListener('click', this.boundHandleClickOutsideEvent);
    }

    /**
     * @private
     */
    handleCloseEvent(event) {
        if (event.detail && event.detail.overlayName === this.getAndValidateOverlayName()) {
            this.close();
        }
    }

    /**
     * @private
     */
    handleOpenEvent(event) {
        if (event.detail && event.detail.overlayName === this.getAndValidateOverlayName()) {
            this.open();
        }
    }

    /**
     * Returns current open state of the overlay
     * @return {boolean}
     */
    get isOpen() {
        return this.internalIsOpen;
    }

    /**
     * Opens overlay: Adds data-visible-class-name class to element and updates this.isOpen
     */
    open() {
        this.internalIsOpen = true;
        // Only setup esc/outside listeners with a minimal delay; if we don't, the click that opened
        // the overlay (which happens outside) will instantly close the overlay.
        setTimeout(() => {
            this.setupEscListener();
            this.setupClickOutsideListener();
        });
        this.scheduleDOMUpdate();
    }

    /**
     * Closes overlay: Removes data-visible-class-name class from element and updates this.isOpen
     */
    close() {
        this.teardownEscListener();
        this.teardownClickOutsideListener();
        this.internalIsOpen = false;
        this.scheduleDOMUpdate();
    }

    /**
     * Reads from DOM (this must be done before the animationFrame writes to DOM) and sets
     * corresponding properties on class.
     * @private
     */
    scheduleDOMUpdate() {

        // Read from DOM instantly; write later
        this.visibleClassName = this.getAndValidateVisibleClassName();
        const backgroundSelector = getAndValidateAttribute({
            name: 'data-background-selector',
            element: this,
        });
        this.backgroundElement = window.document.querySelector(backgroundSelector);
        this.backgroundVisibleClassName = getAndValidateAttribute({
            name: 'data-background-visible-class-name',
            element: this,
        });

        if (!this.animationFrameRequested) {
            this.animationFrameRequested = window.requestAnimationFrame(this.updateDOM.bind(this));
        }

    }

    /**
     * Updtaes the DOM (after requestAnimationFrame). May only *write* to the DOM, never read
     * from it. Reads current state from *instance* and updates accordingly – is never called with
     * any parameters. Thereby we ensure that quick open/close in succession do not write to the
     * DOM multiple times.
     * @private
     */
    updateDOM() {
        // No more DOM update is scheduled: re-set to false
        this.animationFrameRequested = false;
        const method = this.isOpen ? 'add' : 'remove';
        // Update class on overlay
        this.classList[method](this.visibleClassName);
        // Update class on background
        if (this.backgroundElement && this.backgroundVisibleClassName) {
            this.backgroundElement.classList[method](this.backgroundVisibleClassName);
        }
        if (this.isOpen) {
            disableBodyScroll(this);
        } else {
            enableBodyScroll(this);
        }
    }

    /**
     * @private
     */
    handleClickOutsideEvent(event) {
        const disableClickOutside = getAndValidateAttribute({
            name: 'data-disable-click-outside',
            isSet: true,
            element: this,
        });
        if (disableClickOutside) return;
        const { target } = event;
        // Test if target is a child of overlay
        if (this.contains(target)) return;
        this.close();
    }

    /**
     * @private
     */
    handleEscEvent(event) {
        // Only check disable-esc attribute within the handler as it may be changed at
        // runtime
        const disableEsc = getAndValidateAttribute({
            name: 'data-disable-esc',
            isSet: true,
            element: this,
        });
        if (disableEsc) return;
        if (event.keyCode === 27) this.close();
    }

    /**
     * @private
     */
    getAndValidateVisibleClassName() {
        return getAndValidateAttribute({
            name: 'data-visible-class-name',
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
