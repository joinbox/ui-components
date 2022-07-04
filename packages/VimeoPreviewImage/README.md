# YouTube Preview Image

- Displays the a Vimeo poster image for the given video ID
- Supports a fallback image

## Example

````html
    <script type="module">
        import @joinbox/vimeopreviewimage;
    </script>
    <vimeo-preview-image data-video-id="558118399">
        <img src="https://picsum.photos/640/360">
    </vimeo-preview-image>
````

## Components

### VimeoPreviewImage

#### Exposed Element
`<vimeo-preview-image></vimeo-preview-image>`

#### Attributes
- `data-video-id` (required): ID of the Vimeo video whose poster image should be displayed.
- `data-video-width` (int, optional): Used to get best matching video preview image resolution;
Vimeo returns the next smaller sized preview image, see
[docs](https://developer.vimeo.com/api/oembed/videos)

#### Structure
- **Make sure** that `<vimeo-preview-image>` contains an image. Its source will be replaced with
the highest resolution YouTube poster image.