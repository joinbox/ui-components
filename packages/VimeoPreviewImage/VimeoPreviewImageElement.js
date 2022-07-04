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

    /* global HTMLElement, fetch */

    /**
     * Replaces content on click with YouTube movie that auto-plays.
     */
    class YouTubePreviewImage extends HTMLElement {


        baseURL = 'https://vimeo.com/';
        urlInfoPath = 'api/oembed.json';


        constructor() {
            super();

            // Test for image in constructor as it would throw async in connectedCallback where it's
            // difficult to handle (especially in tests)
            if (!this.getImage()) {
                throw new Error(`VimeoPreviewImage: Use an img as child of vimeo-preview-image; content is ${this.innerHTML} instead.`);
            }

            Object.assign(
                this,
                canReadAttributes([{
                    name: 'data-video-id',
                    validate: (value) => !!value,
                    property: 'videoID',
                }, {
                    name: 'data-video-width',
                    transform: (value) => parseInt(value, 10),
                    validate: (value) => !value || !Number.isNaN(parseInt(value, 10)),
                    property: 'width',
                }]),
            );
            this.readAttributes();
        }

        /**
        * Use async so that we can await the api call in our tests
        */
        async connectedCallback() {
            await this.updateImageSource();
        }

        /**
         * Fetches video poster (thumbnail) information from Vimeo API
         */
        async getThumbnailURL() {
            const result = await fetch(this.getVideoInfoURL());
            if (result.status < 200 || result.status >= 300) {
                throw new Error(`VimeoPreviewImage: Status returned by Vimeo API is ${result.status}, should be 200`);
            }
            const json = await result.json();
            return json.thumbnail_url;
        }

        getVideoInfoURL() {
            const params = {
                url: `${this.baseURL}${this.videoID}`,
                ...(this.width ? { width: this.width } : {})
            };
            const getParams = Object.entries(params)
                .map(([key, value]) => `${key}=${value}`)
                .join('&');
            return `${this.baseURL}${this.urlInfoPath}?${getParams}`;
        }

        /**
         * Change source of existing child img element with best quality video preview image
         */
        async updateImageSource() {
            const source = await this.getThumbnailURL();
            this.getImage().setAttribute('src', source);
        }

        getImage() {
            return this.querySelector('img');
        }

    }

    /* global window */
    if (!window.customElements.get('vimeo-preview-image')) {
        window.customElements.define('vimeo-preview-image', YouTubePreviewImage);
    }

})();
