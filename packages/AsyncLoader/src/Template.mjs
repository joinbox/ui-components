export default class Template {

    #rootElement;
    #contentContainer;

    constructor(element, contentContainerSelector) {
        this.#rootElement = element;
        this.#contentContainer = this.#getContentContainer(contentContainerSelector);
    }

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
     * @return {HTMLElement|null}
     * @param selectors
     */
    #getTemplate(selectors) {
        return selectors.reduce((previousMatch, selector) => (
            previousMatch || this.#rootElement.querySelector(selector)
        ), null);
    }

    /**
     * Replaces content in a template; see generateContent method
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
     * @param throwIfNotFound                         Specify to throw an error if template is not
     *                                                found. Used for optional templates.
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
        this.#contentContainer.innerHTML = (
            replacements
                ? this.#replaceTemplateContent(templateContent, replacements)
                : templateContent
        );
    }

    setContent(content) {
        this.#contentContainer.innerHTML = content;
    }
}
