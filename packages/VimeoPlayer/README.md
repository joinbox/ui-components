# Vimeo Video Player

- Replaces content of current element with autoplaying Vimeo video on click
- Automatically unmutes video on devices that support autoplay with sound
- Allows to reset content (to original state, e.g. preview image)

## Example

````html
    <script type="module">
        import @joinbox/vimeoplayer;
    </script>
    <vimeo-player data-video-id="558118399">
        <img src="https://picsum.photos/640/360" class="previewImage">
    </vimeo-player>
    <script>
        // Restore preview image if user clicks esc
        document.addEventListener('keydown', ({ keyCode }) => {
            if (ev.keyCode !== 27) return;
            const player = document.querySelector('vimeo-player');
            player.restore();
        });
    </script>
````

## Components

### VimeoPlayer

#### Exposed Element
`<vimeo-player></vimeo-player>`

#### Attributes
- `data-video-id`: ID of the Vimeo video that should be played

#### Methods
- `restore`: Restore original content (e.g. preview image); make sure you only call this method
after the video was displayed or it will throw.

