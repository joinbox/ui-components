
/**
 * Helper class for AsyncLoader to find template content and display it in a designated container
 */
export default class Template {

    #rootElement;
    #contentContainer;

    /**
     * @param {HTMLElement} element
     * @param {string} contentContainerSelector
     */
    constructor(element, contentContainerSelector) {
        this.#rootElement = element;
        this.#contentContainer = this.#getContentContainer(contentContainerSelector);
    }

    /**
     * Searches and returns a child element of "rootElement" using a css selector
     * to be used as the container for the content.
     * @param {string} selector
     * @return {HTMLElement}
     */
    #getContentContainer(selector) {
        const container = this.#rootElement.querySelector(selector);
        if (!container) {
            throw new Error(`Could not find container to place content within; no child element matches selector ${selector}.`);
        }
        return container;
    }

    /**
     * Finds first matching element using an array of css selectors
     *
     * @param {string[]} selectors
     * @return {HTMLElement|null}
     */
    #getTemplate(selectors) {
        return selectors.reduce((previousMatch, selector) => (
            previousMatch || this.#rootElement.querySelector(selector)
        ), null);
    }

    /**
     * Replaces content in a template; see generateContent method
     *
     * @param {string} template
     * @param {Object.<string, string>} replacements
     * @return {string}
     */
    #replaceTemplateContent(template, replacements) {
        return Array.from(Object.entries(replacements))
            .reduce((prev, [key, value]) => (
                prev.replaceAll(`{{${key}}}`, value)
            ), template);
    }

    /**
     * Gets a child template that matches selector, replaces its content and displays it
     *
     * @param {string[]} selectors                    Array CSS selectors.
     *                                                Finds the first matching template
     * @param {Object.<string, string>} replacements  Object of entries that should be replaced
     *                                                in the template's content. Key is the
     *                                                variables name which will be surrounded by
     *                                                two curly braces (key 'message' will look for
     *                                                '{{message}}' to be replaced)
     * @param {boolean} throwIfNotFound               Specify to throw an error if template is not
     *                                                found. Used for mandatory templates.
     */
    generateContent(selectors, replacements = null, throwIfNotFound = false) {
        const template = this.#getTemplate(selectors);
        if (!template) {
            if (throwIfNotFound) {
                throw new Error(`Could not find child element that matches any selector ${selectors}.`);
            } else {
                return;
            }
        }
        const templateContent = template.innerHTML;
        this.setContent(
            replacements
                ? this.#replaceTemplateContent(templateContent, replacements)
                : templateContent
        );
    }

    /**
     * Puts passed content string in "contentContainer"
     *
     * @param {string} content
     */
    setContent(content) {
        this.#contentContainer.innerHTML = content;
    }
}
