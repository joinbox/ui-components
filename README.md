# Re-usable UI Components for and from Joinbox

## YouTubePlayer

- Replaces DOM element with YouTube player on click
- Auto-plays video when it's ready
- Takes YouTube video ID from DOM
- Loads YouTube API only when needed (on click) and only once (looks for window.YT.Player first)

HTML:
```html
    <div class="youTubeVideo" video-id="m7MtIv9a0A4">Preview</div>
````

JavaScript:
```
import YouTubePlayer from './YouTubePlayer.js';
const youTubePlayer = new YouTubePlayer();
youTubePlayer.init(document.querySelector('.youTubeVideo'));
````

## …