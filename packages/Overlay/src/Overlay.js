import canReadAttributes from '../../../src/shared/canReadAttributes.js';
import createListener from '../../../src/shared/createListener.mjs';
import canRegisterElements from '../../../src/shared/canRegisterElements.js';
import OverlayModel from './OverlayModel.mjs';

/* global HTMLElement, window, document, CustomEvent */



/**
 * Overlay that is opened/closed by open/closeoverlay events. Optionally closes on esc or
 * click outside and always locks background (prevents scrolling).
 */
export default class Overlay extends HTMLElement {

    constructor() {
        super();
        this.model = new OverlayModel();
        Object.assign(
            this,
            canReadAttributes([{
                name: 'data-name',
                validate: (value) => !!value,
                property: 'name',
            }, {
                name: 'data-background-selector',
                property: 'backgroundSelector',
            }, {
                name: 'data-background-visible-class-name',
                property: 'backgroundVisibleClassName',
            }, {
                name: 'data-visible-class-name',
                validate: (value) => !!value,
                property: 'visibleClassName',
            }, {
                name: 'data-disable-esc',
                property: 'disableEsc',
                // Create bool
                transform: (value) => !!value,
            }, {
                name: 'data-disable-click-outside',
                property: 'disableClickOutside',
                transform: (value) => !!value,
            }]),
            canRegisterElements({
                eventType: 'overlay-button',
                eventIdentifier: this.getAttribute('data-name'),
                eventTarget: window,
                model: this.model,
            }),
        );
        this.readAttributes();
        this.registerAnnouncements();
        this.setupModelListeners();
        this.updateDOM();
        this.setupDOMListeners();
    }

    connectedCallback() {
        if (this.backgroundSelector) {
            this.background = document.querySelector(this.backgroundSelector);
        }
    }

    disconnectedCallback() {
        this.background = null;
    }

    handleKeyDown(event) {
        if (event.keyCode === 27 && !this.disableEsc) this.model.close();
    }

    handleClickOutside(event) {
        if (this.disableClickOutside) return;
        const { target } = event;
        // Test if target is a child of overlay
        if (this.contains(target)) return;
        this.model.close();
    }

    /**
     * Listens to model
     * @private
     */
    setupModelListeners() {
        this.model.on('change', this.updateDOM.bind(this));
    }

    setupDOMListeners() {
        window.addEventListener('openOverlay', (event) => {
            if (event.detail.name === this.name) this.model.open();
        });
        window.addEventListener('closeOverlay', (event) => {
            if (event.detail.name === this.name) this.model.close();
        });
    }

    updateDOM() {
        window.requestAnimationFrame(() => {
            const visible = this.model.isOpen;
            const eventPayload = { bubbles: true, detail: { name: this.name } };
            if (visible) {
                this.classList.add(this.visibleClassName);
                if (this.background && this.backgroundVisibleClassName) {
                    this.background.classList.add(this.backgroundVisibleClassName);
                }
                // Legacy event (naming not clear enough); remove on next breaking change
                this.dispatchEvent(new CustomEvent('open', eventPayload));
                // Legacy event (naming clashes with event that actually opens the overlay);
                // remove on next breaking change
                this.dispatchEvent(new CustomEvent('openOverlay', eventPayload));
                this.dispatchEvent(new CustomEvent('overlayOpened', eventPayload));
            } else {
                this.classList.remove(this.visibleClassName);
                if (this.background && this.backgroundVisibleClassName) {
                    this.background.classList.remove(this.backgroundVisibleClassName);
                }
                // Legacy event (naming not clear enough); remove on next breaking change
                this.dispatchEvent(new CustomEvent('close', eventPayload));
                // Legacy event (naming clashes with event that actually opens the overlay);
                // remove on next breaking change
                this.dispatchEvent(new CustomEvent('closeOverlay', eventPayload));
                this.dispatchEvent(new CustomEvent('overlayClosed', eventPayload));
            }
        });

        setTimeout(() => {
            if (this.model.isOpen) {
                // Only add esc/click on open or click on open button will at the same time close
                // the overlay
                this.disconnectEsc = createListener(window, 'keydown', this.handleKeyDown.bind(this));
                this.disconnectClick = createListener(window, 'click', this.handleClickOutside.bind(this));
            } else {
                if (this.disconnectEsc) this.disconnectEsc();
                if (this.disconnectClick) this.disconnectClick();
            }
        });

    }

}

