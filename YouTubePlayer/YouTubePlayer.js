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
export default class {
  
    init(element) {
        if (!element || !(element instanceof HTMLElement)) {
            throw new Error(`YouTubePlayer: Argument provided for init function must be a HTMLElement, is ${element} instead.`);
        }
        this.element = element;
        this.setupClickListener();
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
        // Empty preview to give the user a quick feedback
        this.element.innerHTML = '';
        await this.loadYouTubeAPI();
        this.displayAndPlayVideo();
    }

    async loadYouTubeAPI() {
        // YouTube script was already loaded, Player is ready
        if (window.YT && window.YT.Player && typeof window.YT.Player === 'function') return;
        // Load YouTube iFrame API script
        var tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        return new Promise((resolve) => {
            window.onYouTubeIframeAPIReady = resolve;
        });
    }

    displayAndPlayVideo() {
        const videoId = this.element.getAttribute('video-id');
        if (!videoId) {
            console.warn('YouTubePlayer: video-id attribute not set on DOM element, cannot play video');
        }
        new window.YT.Player(this.element, {
            videoId: videoId,
            events: {
                onReady: (ev) => ev.target.playVideo(),
            }
        });        
    }
  
}
