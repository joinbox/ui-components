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

    /* global HTMLElement, requestAnimationFrame, document, MutationObserver, window */

    /**
     * Simple (horizontal) slider for wide elements that need (horizontal) scrolling
     */
    class Slider extends HTMLElement {

        constructor() {
            super();
            Object.assign(
                this,
                canReadAttributes([{
                    // Button is optional
                    name: 'data-previous-button-selector',
                    property: 'previousButtonSelector',
                }, {
                    // Button is optional
                    name: 'data-next-button-selector',
                    property: 'nextButtonSelector',
                }, {
                    // Active content is optional
                    name: 'data-active-content-selector',
                    property: 'activeContentSelector',
                }, {
                    // Buttons are optional, so is className
                    name: 'data-disabled-button-class-name',
                    property: 'disabledButtonClassName',
                }]),
            );
            this.readAttributes();
        }

        connectedCallback() {
            this.cacheButtons();
            this.setupScrollListener();
            this.calculateButtonVisibility();
            this.updateDOM();
            this.setupClickListener();
            this.showActive();
            this.setupMutationListeners();
            this.setupResizeListeners();
        }

        /**
         * Only select buttons from DOM once to improve performance
         */
        cacheButtons() {
            if (!this.previousButtonSelector && !this.nextButtonSelector) return;
            this.previousButton = document.querySelector(this.previousButtonSelector);
            this.nextButton = document.querySelector(this.nextButtonSelector);
            if (!this.previousButton || !this.nextButton) {
                console.warn(
                    'Previous or next button not found in DOM; previous is %o (selector %s) next is %o (selector %s)',
                    this.previousButton,
                    this.previousButtonSelector,
                    this.nextButton,
                    this.nextButtonSelector,
                );
            }
        }

        getElementWidth() {
            // Get content width without borders, see
            // https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Determining_the_dimensions_of_elements
            return this.clientWidth;
        }

        getContentWidth() {
            return this.scrollWidth;
        }

        setupScrollListener() {
            createListener(this, 'scroll', this.debounceScroll.bind(this));
        }

        debounceScroll() {
            if (this.debounceScrollTimeout) clearTimeout(this.debounceScrollTimeout);
            this.debounceScrollTimeout = setTimeout(this.handleScroll.bind(this), 50);
        }

        handleScroll() {
            this.calculateButtonVisibility();
            this.updateDOM();
        }

        calculateButtonVisibility() {
            const contentIsLarger = this.getContentWidth() > this.getElementWidth();
            const atStart = this.scrollLeft === 0;
            const atEnd = this.scrollLeft === this.getContentWidth() - this.getElementWidth();
            this.isPreviousButtonVisible = contentIsLarger && !atStart;
            this.isNextButtonVisible = contentIsLarger && !atEnd;
        }

        setupClickListener() {
            if (this.previousButton) {
                this.previousButton.addEventListener('click', this.handleButtonClick.bind(this));
            }
            if (this.nextButton) {
                this.nextButton.addEventListener('click', this.handleButtonClick.bind(this));
            }
        }

        handleButtonClick(ev) {
            const direction = ev.currentTarget === this.nextButton ? 1 : -1;
            const scrollDiff = this.getElementWidth() * direction;
            this.scrollBy({
                left: scrollDiff,
                behavior: 'smooth',
            });
        }

        /**
         * Setup MutationObserver that updates button visibility if content of the Slider component
         * changes. Needed if DOM is e.g. modified by JS.
         */
        setupMutationListeners() {
            const config = { childList: true, subtree: true };
            const observer = new MutationObserver((list, obs) => {
                this.calculateButtonVisibility();
                this.updateDOM();
            });
            observer.observe(this, config);
        }

        /**
         * Resizing the window may change the visibility of buttons.
         */
        setupResizeListeners() {
            window.addEventListener('resize', () => {
                this.calculateButtonVisibility();
                this.updateDOM();
            });
        }

        showActive() {
            if (!this.activeContentSelector) return;
            const activeContent = this.querySelector(this.activeContentSelector);
            if (!activeContent) {
                console.warn(
                    'Slider: Active content with selector %s not found in %o',
                    this.activeContentSelector,
                    this,
                );
                return;
            }
            activeContent.scrollIntoView({
                inline: 'center',
            });
        }

        updateDOM() {
            requestAnimationFrame(() => {
                const prevMethod = this.isPreviousButtonVisible ? 'remove' : 'add';
                const nextMethod = this.isNextButtonVisible ? 'remove' : 'add';
                if (!this.disabledButtonClassName && (this.previousButton || this.nextButton)) {
                    console.warn('Slider: Tried to update visible class name on buttons, but disabled button class name is not set');
                }
                // Only update buttons if they exist; they're not mandatory arguments
                if (this.previousButton) {
                    this.previousButton.classList[prevMethod](this.disabledButtonClassName);
                }
                if (this.nextButton) {
                    this.nextButton.classList[nextMethod](this.disabledButtonClassName);
                }
            });
        }

    }

    /* global window */
    if (!window.customElements.get('slider-component')) {
        window.customElements.define('slider-component', Slider);
    }

})();
