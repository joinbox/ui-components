# Re-usable UI Components for and from Joinbox

## YouTubePlayer

- Replaces DOM element with auto-playing YouTube player on click

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