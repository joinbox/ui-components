/**
 * YouTubePlayer that replaces preview image with the YouTube player (iFrame API) that autoplays
 * the video. Use:
 * <div class="youTubeVideo" video-id="m7MtIv9a0A4">Preview</div>
 * <script type="module">
 *    import YouTubePlayer from './YouTubePlayer.js';
 *    const youTubePlayer = new YouTubePlayer();
 *    youTubePlayer.init(document.querySelector('.youTubeVideo'));
 * </script>
 */
export default class YouTubePlayer {

    /* global requestAnimationFrame, window, document, HTMLElement */

    /**
     * @private
     */
    attributes = new Map([
        ['videoId', 'videoId'],
        ['videoParameters', 'videoParameters'],
        ['loadingClass', 'loadingClass'],
    ]);

    /**
     * @private
     */
    youTubeScriptURL = 'https://www.youtube.com/iframe_api';


    /**
     * Initializes YouTube video
     * @param  {HTMLElement} element    Element that will be replaced with YouTube video as soon
     *                                  as it is clicked
     */
    init(element) {
        if (!element || !(element instanceof HTMLElement)) {
            throw new Error(`YouTubePlayer: Argument provided for init function must be a HTMLElement, is ${element} instead.`);
        }
        this.element = element;
        this.setupClickListener();
        this.setupHoverListener();
    }

    /**
     * To minimize delay, pre-load YouTube script as soon as user hovers the video preview
     * @private
     */
    setupHoverListener() {
        this.element.addEventListener('mouseenter', this.loadYouTubeAPI.bind(this));
    }

    /**
     * @private
     */
    setupClickListener() {
        this.boundClickHandler = this.clickHandler.bind(this);
        this.element.addEventListener('click', this.boundClickHandler);
    }

    /**
     * @private
     */
    removeClickHandler() {
        this.element.removeEventListener('click', this.boundClickHandler);
    }

    /**
     * @private
     */
    async clickHandler() {
        // Click handler is only needed once; remove it as soon as it's been used
        this.removeClickHandler();
        this.addLoadingClass();
        await this.loadYouTubeAPI();
        this.displayAndPlayVideo();
    }

    /**
     * @private
     */
    async loadYouTubeAPI() {
        // YouTube script was already loaded, Player is ready
        if (window.YT && window.YT.Player && typeof window.YT.Player === 'function') return;
        // Check if there is already a YouTube script: If there is, just wait until it's done
        const existingTag = document.querySelector(`script[src="${this.youTubeScriptURL}"]`);
        // There is no script tag: Create and add it to the DOM
        if (!existingTag) {
            const tag = document.createElement('script');
            tag.setAttribute('src', this.youTubeScriptURL);
            // There must be a script somewhere as this code itself is a script
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
        await new Promise((resolve) => {
            window.onYouTubeIframeAPIReady = resolve;
        });
    }

    /**
     * @private
     */
    addLoadingClass() {
        if (this.getLoadingClass()) {
            requestAnimationFrame(() => this.element.classList.add(this.getLoadingClass()));
        }
    }

    /**
     * @private
     */
    removeLoadingClass() {
        if (this.getLoadingClass()) {
            requestAnimationFrame(() => this.element.classList.remove(this.getLoadingClass()));
        }
    }

    /**
     * Get name of class that should be added to element from element's attributes
     * @return {string}
     */
    getLoadingClass() {
        const className = this.element.dataset[this.attributes.get('loadingClass')] || '';
        if (!className) {
            console.log(`YouTubePlayer: Attribute ${this.attributes.get('loadingClass')} not set on element, cannot add loading class.`);
        }
        return className;
    }

    /**
     * Reads player parameters from DOM (JSON), parses and returns them. Fails gracefully if
     * parameters cannot be parsed, but displays error.
     * @private
     */
    getVideoParameters() {
        const json = this.element.dataset[this.attributes.get('videoParameters')];
        if (!json) return {};
        let parameters;
        try {
            parameters = JSON.parse(json);
        } catch (err) {
            parameters = {};
            console.error(`YouTubePlayer: Parameters ${json} could not be parsed, JSON is not valid: ${err.message}`);
        }
        return parameters;
    }


    /**
     * @private
     */
    displayAndPlayVideo() {
        const videoId = this.element.dataset[this.attributes.get('videoId')];
        if (!videoId) {
            console.error(`YouTubePlayer: attribute ${this.attributes.get('videoId')} not set on DOM element, cannot play video`);
        }
        this.removeLoadingClass();
        new window.YT.Player(this.element, {
            playerVars: this.getVideoParameters(),
            videoId,
            events: {
                onReady: ev => ev.target.playVideo(),
            },
        });
    }

}
