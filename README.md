# Re-usable UI Components for and from Joinbox

## YouTubePlayer

- Replaces DOM element with YouTube player on click
- Auto-plays video when it's ready
- Reads YouTube video ID and params from element attribute
- Reads class name from element attribute and adds it while the player is loading
- Loads YouTube API only when needed (on click and pre-load on hover) and only once (looks for window.YT or existing script tag first)

HTML:
```html
    <div
        class="youTubeVideo"
        data-video-id="m7MtIv9a0A4"
        data-video-parameters='{ "controls": 0, "modestbranding": 1 }'
        data-loading-class="youTubeVideo--loading"
    >
        Preview
    </div>
````

JavaScript:
```
import { YouTubePlayer } from '@joinbox/ui-components';
const youTubePlayer = new YouTubePlayer();
youTubePlayer.init(document.querySelector('.youTubeVideo'));
````

## Overlay and Overlay Button

- Overlay can be opened with `<jb-overlay-button>`, event or method
- Overlay can be closed with `<jb-overlay-button>`, event, method, esc key or click outside
- Accepts any background element through a selector
- Classes to make overlay and background visible are freely configurable
- Close through esc and/or clickt outside can be disabled
- An overlay can be controlled by any number of `jb-overlay-button`

### Example

HTML:
```html
    <jb-overlay-button data-overlay-name="mainOverlay" data-button-type="open">
        Open Overlay
    </jb-overlay-button>

    <jb-overlay
        data-overlay-name="mainOverlay"
        data-visible-class-name="overlay--visible"
        data-background-selector="#overlayBackground"
        data-background-visible-class-name="overlayBackground--visible"
        data-disable-esc
        data-disable-click-outside
    >
        <jb-overlay-button data-overlay-name="mainOverlay" data-button-type="close">
            ×
        </jb-overlay-button>
        <h1>Main Overlay</h1>
        <p>Overlay body copy</p>
    </jb-overlay>

    <div id="overlayBackground"></div>
```

### Overlay

#### Attributes
- `data-overlay-name` names the overlay; the name must exactly match same attribute on
`jb-overlay-button` to be opened/closed by it
- `data-visible-class-name` contains the class name that will be added to the overlay when it is
opened and removed when it is closed
- `data-background-selector` takes any CSS selector and defines the element that will receive
`data-background-visible-class-name` when the overlay opens
- `data-background-visible-class-name` defines the class that will be added to the background
element when the overlay is opened and removed when the overlay is closed
- `data-disable-esc` prevents the overlay from being closed when users press the ESC key
- `data-disable-click-outside` prevents the overlay from being closed when users click with their
mouse outside of the overlay

#### Methods
- `close()`: Closes overlay
- `open(): Opens overlay

#### Events
- `openoverlay` with `{ detail: { overlayName: 'nameOfOverlay' } }` opens the overlay
- `closeoverlay` with `{ detail: { overlayName: 'nameOfOverlay' } }` closes the overlay

### Overlay Button

#### Attributes
- `data-overlay-name` contains the name of the overlay that should be opened or closed. Make sure
it exactly matches the same attribute on `jb-overlay`.
- `data-button-type` is either `close` if the button shall close or `open` if the button shall
open the overlay.


# Tests

Make sure that you use version 13 of Node.js and run `npm test`.

