import canReadAttributes from '../../../src/shared/canReadAttributes.js';

/* global HTMLElement, Image */

/**
 * Replaces content on click with YouTube movie that auto-plays.
 */
export default class YouTubePreviewImage extends HTMLElement {

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
     * imag if provided resolution is not found; therefore treat 120px wide images as invalid.
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
            img.addEventListener('error', () => resolve(false))
            img.setAttribute('src', url);
        });
    }

}
