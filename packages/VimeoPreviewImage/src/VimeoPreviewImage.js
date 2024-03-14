import canReadAttributes from '../../../src/shared/canReadAttributes.js';

/* global HTMLElement, fetch */

/**
 * Replaces content on click with YouTube movie that auto-plays.
 */
export default class YouTubePreviewImage extends HTMLElement {


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
