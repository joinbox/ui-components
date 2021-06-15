import canReadAttributes from '../../src/shared/canReadAttributes.js';

/* global HTMLElement, requestAnimationFrame, document, window */

/**
 * Overlay that is opened/closed by open/closeoverlay events. Optionally closes on esc or
 * click outside and always locks background (prevents scrolling).
 */
export default class TableOfContents extends HTMLElement {

    chapters = [];

    constructor() {
        super();
        Object.assign(
            this,
            canReadAttributes([{
                name: 'data-chapters-selector',
                property: 'chaptersSelector',
                validate: value => !!value,
            }, {
                name: 'data-template-selector',
                validate: value => !!value,
                property: 'templateSelector',
            }, {
                name: 'data-template-content-selector',
                property: 'templateContentSelector',
                validate: value => !!value,
            }, {
                name: 'data-template-link-selector',
                property: 'templateLinkSelector',
            }, {
                name: 'data-offset-selector',
                property: 'offsetSelector',
            }, {
                name: 'data-update-event-name',
                property: 'updateEventName',
            }, {
                name: 'data-offset-value',
                property: 'offsetValue',
                validate: value => !value || !Number.isNaN(parseInt(value, 10)),
                transform: value => parseInt(value, 10),
            }]),
        );
        this.readAttributes();
    }

    connectedCallback() {
        this.getChapters();
        this.updateDOM();
        this.setupUpdateEventListener();
    }

    setupUpdateEventListener() {
        if (!this.updateEventName) return;
        window.addEventListener(this.updateEventName, () => {
            this.getChapters();
            this.updateDOM();
        });
    }

    /**
     * Returns height of a given element that should be used to offset scroll
     */
    getScrollOffset() {
        if (this.offsetValue) return this.offsetValue;
        if (!this.offsetSelector) return 0;
        const offsetElement = document.querySelector(this.offsetSelector);
        if (!offsetElement) {
            console.warn(`TableOfContents: Element to read offsetHeight from with selector ${this.offsetSelector} could not be found in DOM. Using 0 as default offset.`);
            return 0;
        }
        return offsetElement.getBoundingClientRect().height;
    }

    /**
     * Reads all chapters from DOM, stores them
     */
    getChapters() {
        // Reset chapters to empty array; necessary to ensure that entries are not duplicated
        // when we update the contents when this.updateEventName is caught.
        this.chapters = [];
        const chapters = document.querySelectorAll(this.chaptersSelector);
        if (!chapters.length) {
            console.warn('No titles found for selector %s', this.chaptersSelector);
        }
        for (const chapter of chapters) {
            const content = chapter.textContent;
            this.chapters.push({
                title: content,
                element: chapter,
            });
        }
    }

    /**
     * Handles click on a single title in the table of contents
     */
    handleTitleClick(ev) {
        // If we added an anchor link (to improve accessibility) prevent default to enable smooth
        // scroll and not propagate hashtag to URL.
        ev.preventDefault();
        const tocElement = ev.currentTarget;
        // Original element was stored as a property on the title in the toc
        const originalTitle = tocElement.element;
        if (!originalTitle) {
            console.warn('Original element to scroll to not found for %o', tocElement);
            return;
        }
        const scrollDifference = originalTitle.getBoundingClientRect().top;
        window.scrollBy({
            top: scrollDifference - this.getScrollOffset(),
            behavior: 'smooth',
        });
    }

    /**
     * Gets template from DOM, returns it
     */
    getTemplate() {
        const template = this.querySelector(this.templateSelector);
        if (!template) {
            throw new Error(`TableOfContents: Template element with selector ${this.templateSelector} not found in ${this.outerHTML}`);
        }
        return template;
    }

    /**
     * Adds anchor links: href="#idValue" to link element and id="idValue" to title element. Is
     * required for accessible websites (WCAG 2.1 AA)
     * @param {HTMLElement} chapter     Chapter/title that will be linked
     * @param {HTMLElement} element     Current item in TOC
     */
    addAnchorLink(chapter, element) {
        if (!this.templateLinkSelector) return;
        const link = (element.matches(this.templateLinkSelector) && element) ||
            element.querySelector(this.templateLinkSelector);
        if (!link) {
            console.warn('TableOfContents: data-template-link-selector was set and is %s, but corresponding HTML element could not be found in template', this.templateLinkSelector);
            return;
        }
        // Use normalized content of title as id and therefore as href attribute
        const idValue = chapter.getAttribute('id') || chapter.textContent
            .replace(/[^a-zA-Z0-9]+/g, '-')
            // Remove - from start and end
            .replace(/(^-|-$)/g, '')
            .toLowerCase();
        link.setAttribute('href', `#${idValue}`);
        chapter.setAttribute('id', idValue);
    }

    updateDOM() {
        const template = this.getTemplate();
        // Create fragment to only modify the main DOM tree once
        const fragment = document.createDocumentFragment();
        this.chapters.forEach((chapter) => {
            // We must use firstElementChild as we're adding a click handler later, which will
            // not work on DocumentFragments, see
            // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template
            const clone = template.content.firstElementChild.cloneNode(true);
            // Get element from template that contains title , add chapter's title; may also be
            // the clone itself (which is firstElementChild of template)
            const contentNode = (clone.matches(this.templateContentSelector) && clone) ||
                clone.querySelector(this.templateContentSelector);
            if (!contentNode) {
                throw new Error(`TableOfContents: Element to append title to not found; selector is ${this.templateContentSelector}, template ${clone.outerHTML}`);
            }
            contentNode.textContent = chapter.title;
            // Store element (reference) on DOM node to scroll to it on click
            clone.element = chapter.element;
            // Listen to click event
            clone.addEventListener('click', this.handleTitleClick.bind(this));
            this.addAnchorLink(chapter.element, clone);
            // Only append content of div, not temporary div itself
            fragment.appendChild(clone);
        });
        // Remove previous contents; needed if e.g. updateEventName is dispatched to prevent
        // duplicates
        const toRemove = [...template.parentNode.children]
            .filter(item => !item.matches(this.templateSelector));
        // Append table of contents after template; template must therefore be placed at the
        // place where content will be inserted
        requestAnimationFrame(() => {
            for (const elementToRemove of toRemove) {
                template.parentNode.removeChild(elementToRemove);
            }
            template.parentNode.appendChild(fragment);
        });
    }

}
