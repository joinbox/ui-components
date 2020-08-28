import canReadAttributes from '../shared/canReadAttributes.js';
import createListener from '../shared/createListener.mjs';

/* global HTMLElement, window, document */

/**
 * Simple (horizontal) slider for wide elements that need (horizontal) scrolling
 */
export default class extends HTMLElement {

    constructor() {
        super();
        Object.assign(
            this,
            canReadAttributes([{
                name: 'data-previous-button-selector',
                validate: value => !!value,
                property: 'previousButtonSelector',
            }, {
                name: 'data-next-button-selector',
                validate: value => !!value,
                property: 'nextButtonSelector',
            }, {
                name: 'data-active-content-selector',
                property: 'activeContentSelector',
            }, {
                name: 'data-button-visible-class-name',
                validate: value => !!value,
                property: 'buttonVisibleClassName',
            }]),
        );
        this.readAttributes();
    }

    connectedCallback() {
        this.setupScrollListener();
        this.calculateButtonVisibility();
        this.cacheButtons();
        this.updateDOM();
    }

    /**
     * Only select buttons from DOM once to improve performance
     */
    cacheButtons() {
        this.previousButton = document.querySelector(this.previousButtonSelector);
        this.nextButton = document.querySelector(this.nextButtonSelector);
        if (!this.previousButton || !this.nextButton) {
            console.warn(
                'Previous or next button not found in DOM; previous is %o (selector %s) next is %o (selector %s)',
                this.previousButton,
                this.previousButtonSelector,
                this.nextButton,
                this.nextButtonSelector
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
        console.log('scroll');
        this.calculateButtonVisibility();
        this.updateDOM();
    }

    calculateButtonVisibility() {
        const contentIsLarger = this.getContentWidth() > this.getElementWidth();
        const atStart = this.scrollLeft === 0;
        const atEnd = this.scrollLeft === this.getContentWidth() - this.getElementWidth();
        this.isPreviousButtonVisible = contentIsLarger && !atStart;
        this.isNextButtonVisible = contentIsLarger && !atEnd;
        console.log(this.isPreviousButtonVisible, this.isNextButtonVisible);
    }

    handleClick() {

    }

    updateDOM() {
        requestAnimationFrame(() => {
            if (this.isPreviousButtonVisible) {
                this.previousButton.classList.add() …
            }
        });
    }

}
