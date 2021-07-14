import canReadAttributes from '../../../src/shared/canReadAttributes.js';
import loadVimeoAPI from './loadVimeoAPI.js';

/* global HTMLElement */

/**
 * Replaces content on click with YouTube movie that auto-plays.
 */
export default class extends HTMLElement {

    baseURL = 'https://player.vimeo.com/video/';
    allow = ['autoplay', 'fullscreen'];
    parameters = {
        autoplay: 'true',
        // Muted is needed for autoplay on some devices (e.g. Safari/iOS); see this.unmute()
        muted: 'true',
    }
    attributes = 'width="640" height="360" frameborder="0" allowfullscreen';
    /**
     * Stores the original content of the element (before the video was displayed); needed to
     * restore and to check if video is already being displayed
     */
    originalContent = null

    constructor() {
        super();
        Object.assign(
            this,
            canReadAttributes([{
                name: 'data-video-id',
                validate: value => !!value,
                property: 'videoId',
            }]),
        );
        this.readAttributes();
    }

    connectedCallback() {
        this.setupClickListener();
    }

    /**
     * Generate IFrame url from this class' properties
     * @returns {string}
     */
    generateIFrameURL() {
        const parameters = new URLSearchParams(this.parameters);
        return `<iframe src="${this.baseURL}${this.videoId}?${parameters}" allow="${this.allow.join(';')}" ${this.attributes}></iframe>`;
    }

    setupClickListener() {
        this.addEventListener('click', this.insertVideo.bind(this));
    }

    /**
     * Restore original content in video (e.g. poster image)
     */
    restore() {
        if (!this.originalContent) {
            throw new Error('VimeoPlayer: this.originalContent is not set; make sure you only restore the original content after the video was dispalyed.')
        }
        this.innerHTML = this.originalContent;
        this.originalContent = null;
    }

    /**
     * Replace content of custom element with Vimeo player
     */
    insertVideo() {
        // If video is already being displayed, there is no need to replace it again; it would
        // e.g. reset the current playing state
        if (this.orignalContent) return;
        this.originalContent = this.innerHTML;
        this.innerHTML = this.generateIFrameURL();
        this.unmute();
    }

    /**
     * Some devices (e.g. Safari on iOS) do not allow unmuted videos to be autoplayed. As it is
     * hard/impossible to discover those devices, go the opposite way: Mute all videos and try
     * to unmute them afterwards through the Vimeo Player API.
     */
    async unmute() {
        const iframe = this.querySelector('iframe');
        if (!iframe) {
            throw new Error(`VimeoPlayer: IFrame not found in content, is ${this.innerHTML}`);
        }
        // Load the player from CDN asynchronously to improve loading performance and to not have
        // to mess around with non-ES modules (such as @vimeo/player)
        // Store promise and player in class property to enable unit testing (we must await the
        // promise)
        this.vimeoPlayerPromise = loadVimeoAPI();
        const Player = await this.vimeoPlayerPromise;
        this.player = new Player(iframe);
        this.player.setVolume(1);
    }

}
