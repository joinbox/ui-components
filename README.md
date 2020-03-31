# Re-usable UI Components for and from Joinbox

## YouTubePlayer

- Replaces DOM element with YouTube player on click
- Auto-plays video when it's ready
- Reads YouTube video ID from element attribute
- Reads class name from element attribute and adds it while the player is loading
- Loads YouTube API only when needed (on click and pre-load on hover) and only once (looks for window.YT or existing script tag first)

HTML:
```html
    <div
        class="youTubeVideo"
        data-video-id="m7MtIv9a0A4"
        data-loading-class="elementName--loading"
    >
        Preview
    </div>
````

JavaScript:
```
import YouTubePlayer from './YouTubePlayer.js';
const youTubePlayer = new YouTubePlayer();
youTubePlayer.init(document.querySelector('.youTubeVideo'));
````

## …