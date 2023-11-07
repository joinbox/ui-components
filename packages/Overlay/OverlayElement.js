(function () {
    'use strict';

    /**
     * Simplifies watching attributes; pass in a config and this mixin will automatically store
     * attribute values in a component to reduce DOM reads and simplify validation.
     * IMPORTANT: We might want to use observable attributes in the future; we did not do so now,
     * because
     * a) it's hard to add the static method to he class that consumes the mixin
     * b) there is no JSDOM support for observable attributes, which makes testing a pain
     * @param {object[]} config     Attribute config; each entry may consist of the following
     *                              properties:
     *                              - name (string, mandatory): Name of the attribute to watch
     *                              - validate (function, optional): Validation function; return a
     *                                falsy value if validation is not passed
     *                              - property (string, optional): Class property that the value
     *                                should be stored in; if not set, name will be used instead
     *                              - transform (function): Transforms value before it is saved as a
     *                                property
     */
    var canReadAttributes = (config) => {

        if (!config.every(item => item.name)) {
            throw new Error(`canReadAttribute: Every config entry must be an object with property name; you passed ${JSON.stringify(config)} instead.`);
        }

        return {
            readAttributes() {
                config.forEach((attributeConfig) => {
                    const {
                        name,
                        validate,
                        property,
                        transform,
                    } = attributeConfig;
                    // Use getAttribute instead of dataset, as attribute is not guaranteed to start
                    // with data-
                    const value = this.getAttribute(name);
                    if (typeof validate === 'function' && !validate(value)) {
                        throw new Error(`canWatchAttribute: Attribute ${name} does not match validation rules`);
                    }
                    const transformFunction = transform || (initialValue => initialValue);
                    const propertyName = property || name;
                    this[propertyName] = transformFunction(value);
                });
            },
        };

    };

    /**
     * Adds event listener to an element and returns removeEventListener function that only needs to
     * be called to de-register an event.
     * @example
     * const disposer = createListener(window, 'click', () => {});
     */
    var createListener = (element, eventName, handler) => {
        // Takes this from execution context which must be the custom element
        element.addEventListener(eventName, handler);
        return () => element.removeEventListener(eventName, handler);
    };

    /**
     * Mixin for a component that announces itself by dispatching an event
     * @example 
     * class extends HTMLElement {
     *     constructor() {
     *         Object.assign(this, canRegisterElements({ eventTarget: this }));
     *     }
     *     connectedCallback() {
     *         this.registerAnnouncements();
     *     }
     * }
     * */
    var canRegisterElements = ({
        eventName = 'announce-element',
        eventTarget = window, // Does that work?
        eventType,
        eventIdentifier,
        model,
    } = {}) => (
        {
            registerAnnouncements() {
                eventTarget.addEventListener(eventName, (ev) => {
                    const { detail } = ev;
                    if (eventType && detail.eventType !== eventType) return;
                    if (eventIdentifier && detail.eventIdentifier !== eventIdentifier) return;
                    const { element } = ev.detail;
                    if (typeof element.setModel !== 'function') {
                        console.warn(`canRegisterElement: setModel is not a function on announcing element, but ${element.setModel}.`);
                    } else {
                        element.setModel(model);
                    }
                });
            },
        }
    );

    /**
     * Simple EventEmitter mixin; use our own implementation as a) most NPM modules don't provide an
     * ES6 export and b) they're not made to be used as mixins.
     * Export a function for all mixins, even if not needed here (consistency).
     */
    var canEmitEvents = () => {

        return {

            /**
             * Map that holds all callbacks for all types
             * @type Map.<*, function[]>
            */
            eventHandlers: new Map(),

            /**
             * Adds event handler for a given type
             * @param {*} type               Name of the event handler
             * @param {function} callback    Callback to call if corresponding event is emitted
            */
            on(type, callback) {
                if (!this.eventHandlers.has(type)) this.eventHandlers.set(type, [callback]);
                else this.eventHandlers.get(type).push(callback);
            },

            /**
             * Removes an event handler; if only type is given, all callbacks of the type will be
             * removed. If type and callback are given, only the specific callbacks for the given type
             * will be removed.
             * @param {*} type               Type of event handler to remove
             * @param {function} callback    Callback to remove
             */
            off(type, callback) {
                if (!this.eventHandlers.has(type)) return;
                if (!callback) this.eventHandlers.delete(type);
                else {
                    this.eventHandlers.set(
                        type,
                        this.eventHandlers.get(type).filter(cb => cb !== callback),
                    );
                }
            },

            /**
             * Calls all callbacks of the provided type with the given parameters.
             * @param {*} type          Type of eventHandler to call
             * @param {...*} params     Parameters to pass to callbacks
             */
            emit(type, ...params) {
                (this.eventHandlers.get(type) || []).forEach(handler => handler(...params));
            },
        };

    };

    class OverlayModel {

        isOverlayOpen = false;

        constructor() {
            Object.assign(this, canEmitEvents());
        }

        open() {
            // Prevent unnecessarily emitted event
            if (this.isOverlayOpen) return;
            this.isOverlayOpen = true;
            this.emit('change');
        }

        close() {
            // Prevent unnecessarily emitted event
            if (!this.isOverlayOpen) return;
            this.isOverlayOpen = false;
            this.emit('change');
        }

        toggle() {
            this.isOverlayOpen = !this.isOverlayOpen;
            this.emit('change');
        }


        get isOpen() {
            return this.isOverlayOpen;
        }

    }

    /* global HTMLElement, window, document, CustomEvent */



    /**
     * Overlay that is opened/closed by open/closeoverlay events. Optionally closes on esc or
     * click outside and always locks background (prevents scrolling).
     */
    class Overlay extends HTMLElement {

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
                    this.dispatchEvent(new CustomEvent('overlayOpened', eventPayload));
                } else {
                    this.classList.remove(this.visibleClassName);
                    if (this.background && this.backgroundVisibleClassName) {
                        this.background.classList.remove(this.backgroundVisibleClassName);
                    }
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

    /* global window */
    if (!window.customElements.get('overlay-component')) {
        window.customElements.define('overlay-component', Overlay);
    }

})();
