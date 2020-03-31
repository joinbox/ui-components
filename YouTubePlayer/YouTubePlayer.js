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

    loadingClassAttribute = 'data-loading-class';
    videoIdAttribute = 'data-video-id';
    youTubeScriptURL = 'https://www.youtube.com/iframe_api';

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
     */
    setupHoverListener() {
        this.element.addEventListener('mouseenter', this.loadYouTubeAPI.bind(this));
    }
  
    setupClickListener() {
        this.boundClickHandler = this.clickHandler.bind(this);
        this.element.addEventListener('click', this.boundClickHandler);
    }

    removeClickHandler() {
        this.element.removeEventListener('click', this.boundClickHandler);
    }

    async clickHandler() {
        // Click handler is only needed once; remove it as soon as it's been used
        this.removeClickHandler();
        this.addLoadingClass();
        await this.loadYouTubeAPI();
        this.displayAndPlayVideo();
    }

    async loadYouTubeAPI() {
        // YouTube script was already loaded, Player is ready
        if (window.YT && window.YT.Player && typeof window.YT.Player === 'function') return;
        // Check if there is already a YouTube script: If there is, just wait until it's done
        const existingTag = document.querySelector(`script[src="${this.youTubeScriptURL}"]`)
        // There is no script tag: Create and add it to the DOM
        if (!existingTag) {
            var tag = document.createElement('script');
            tag.setAttribute('src', this.youTubeScriptURL);
            // There must be a script somewhere as this code itself is a script
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
        return new Promise((resolve) => {
            window.onYouTubeIframeAPIReady = resolve;
        });
    }

    addLoadingClass() {
        if (this.getLoadingClass()) {
            requestAnimationFrame(() => this.element.classList.add(this.getLoadingClass()));
        }
    }

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
        const className = this.element.getAttribute(this.loadingClassAttribute) || '';
        if (!className) {
            console.log(`YouTubePlayer: Attribute ${this.loadingClassAttribute} not set on element, cannot add loading class.`);
        }
        return className;
    }


    displayAndPlayVideo() {
        const videoId = this.element.getAttribute(this.videoIdAttribute);
        if (!videoId) {
            console.error('YouTubePlayer: video-id attribute not set on DOM element, cannot play video');
        }
        this.removeLoadingClass();
        new window.YT.Player(this.element, {
            videoId: videoId,
            events: {
                onReady: (ev) => ev.target.playVideo(),
            }
        });
    }
  
}
