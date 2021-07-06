# YouTube Preview Image

- Displays the highest resolution preview (poster) image for a given YouTube identifier
- Supports a fallback image

## Example

````html
<youtube-player-component
    data-video-id="m7MtIv9a0A4"
    data-loading-class-name="loading"
    data-player-variables='{ "controls": 0, "modestbranding": 1 }'
>
    Preview here
</youtube-player-component>

<!-- Import all components you use -->
<script src="@joinbox/youtubeplayer/YouTubePlayerElement.js"></script>
````

## Components

### YouTubePlayer

#### Exposed Element
`<youtube-player-component></youtube-player-component>`

#### Attributes
- `data-video-id`: ID of the YouTube video to play.
- `data-loading-class-name`: Class that should be added to `<youtube-player-component>` while
the YouTube player (script) is loading.
- `data-player-variables`: [Player parameters](https://developers.google.com/youtube/player_parameters.html?playerVersion=HTML5)
for YouTube.
