# YouTube Preview Image

- Displays the highest resolution preview (poster) image for a given YouTube identifier
- Supports a fallback image

## Example

````html
    <script type="module">
        import @joinbox/youtubepreviewimage;
    </script>
    <youtube-preview-image data-video-id="m7MtIv9a0A4">
        <img src="https://picsum.photos/200/300">
    </youtube-preview-image>
````

## Components

### YouTubePreviewImage

#### Exposed Element
`<youtube-preview-image></youtube-preview-image>`

#### Attributes
- `data-video-id`: ID of the YouTube video whose poster image should be displayed.

#### Structure
- **Make sure** that `<youtube-preview-image>` contains an image. Its source will be replaced with
the highest resolution YouTube poster image.