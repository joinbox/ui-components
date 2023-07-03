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

    /* global HTMLElement, Image */

    /**
     * Replaces content on click with YouTube movie that auto-plays.
     */
    class YouTubePreviewImage extends HTMLElement {

        /**
         * Available image URL suffixes, highest quality first
         */
        imageSuffixes = [
            'maxresdefault',
            'hqdefault',
            'mqdefault',
            'sddefault',
            'default',
        ]

        constructor() {
            super();

            // Test for image in constructor as it would throw async in connectedCallback where it's
            // difficult to handle (especially in tests)
            if (!this.getImage()) {
                throw new Error(`YouTubePreviewImage: Use an img as child of youtube-preview-image; content is ${this.innerHTML} instead.`);
            }

            Object.assign(
                this,
                canReadAttributes([{
                    name: 'data-video-id',
                    validate: value => !!value,
                    property: 'videoID',
                }]),
            );
            this.readAttributes();
        }

        async connectedCallback() {
            await this.updateImageSource();
        }

        /**
         * Find best resolution preview image for current videoID
         */
        async getBestValidImage() {
            for (const resolution of this.imageSuffixes) {
                const url = this.generateImageURL(this.videoID, resolution);
                const isValid = await (this.testImage(url));
                if (isValid) return url;
            }
            return null;
        }

        /**
         * Returns the first img child of this component; its src attribute will be changed to the
         * preview image
         */
        getImage() {
            return this.querySelector('img');
        }

        /**
         * Change source of existing child img element with best quality video preview image
         */
        async updateImageSource() {
            const source = await this.getBestValidImage();
            if (source) {
                this.getImage().setAttribute('src', source);
            }
        }

        /**
         * Returns preview image URL for a given videoID and resolution (suffix)
         * @param {string} videoID
         * @param {string} suffix
         * @returns {string}
         */
        generateImageURL(videoID, suffix) {
            return `https://img.youtube.com/vi/${videoID}/${suffix}.jpg`
        }

        /**
         * Tests if a given image URL returns a valid image. YouTube falls back to a 120px wide default
         * image if provided resolution is not found; therefore treat 120px wide images as inexistent.
         * This happens if a video exists but not all preview resolutions were generated (opposed
         * to a video which does not exist at all which will call the error handler).
         * @param {string} url
         * @returns {Promise}       Resolves to true if image is valid, else to false
         */
        async testImage(url) {
            const img = new Image();
            return new Promise((resolve) => {
                img.addEventListener('load', () => {
                    if (img.naturalWidth === 120) resolve(false);
                    else resolve(true);
                });
                img.addEventListener('error', () => resolve(false));
                img.setAttribute('src', url);
            });
        }

    }

    /* global window */
    if (!window.customElements.get('youtube-preview-image')) {
        window.customElements.define('youtube-preview-image', YouTubePreviewImage);
    }

})();
