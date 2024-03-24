# Overlay

Overlay component that can be opened and closed via OverlayButtons. Supports:
- close when user presses esc (optional)
- close when user clicks outside (optional)
- disable body scroll
- any number of open/close/toggle buttons that control the overlay
- the use of any background element through a selector and any class on that background element
to make it visible


## Important

Load `<overlay-component>` before `<overlay-button-component>` as the button needs the overlay
to exist before it is setup (setModel will not be called if `<overlay-component>` does not
exist).

If you want to disable scroll when the overlay is open, use 
[Body Scroll Lock](https://www.npmjs.com/package/body-scroll-lock):

```javascript
import { disableBodyScroll, enableBodyScroll } from '/body-scroll-lock/lib/bodyScrollLock.es6.js';
const overlay = document.querySelector('#my-overlay-identifier');
overlay.addEventListener('openOverlay', disableBodyScroll);
overlay.addEventListener('closeOverlay', enableBodyScroll);
```

## Example

````html
<overlay-button-component data-overlay-name="myOverlay" data-type="open">
    Open Restricted
</overlay-button-component>

<overlay-component
    data-name="myOverlay"
    data-background-selector=".overlay-background"
    data-background-visible-class-name="visible"
    data-visible-class-name="visible"
    data-disable-esc="true"
    data-disable-click-outside="true"
>
    <overlay-button-component data-overlay-name="myOverlay" data-type="close">
        ×
    </overlay-button-component>
</overlay-component>

<!-- Import all components you use -->
<script src="@joinbox/overlay/OverlayElement.js"></script>
<script src="@joinbox/overlay/OverlayButtonElement.js"></script>
````

## Components

### Overlay

#### Exposed Element
`<overlay-component></overlay-component>`

#### Attributes
- `data-name` (required, `String`): Names the overlay; the name must exactly match attribute
`data-overlay-name` on `overlay-button-component` to be opened/closed by it.
- `data-visible-class-name` (required, `String`): Contains the class name that will be added to the
overlay when it is opened and removed when it is closed.
- `data-background-selector` (optional, `String`): Takes any CSS selector and defines the element
that will receive `data-background-visible-class-name` when the overlay opens.
- `data-background-visible-class-name` (optional, `String`). Defines the class that will be added to
the background element when the overlay is opened and removed when the overlay is closed.
- `data-disable-esc` (optional, `Boolean` i.e. can be set without attribute or not at all):
Prevents the overlay from being closed when users press the ESC key. Defaults to false.
- `data-disable-click-outside` (optional, `Boolean`  i.e. can be set without attribute or not at
all): Prevents the overlay from being closed when users click with their mouse outside of the
overlay. Defaults to false.

#### Events

The overlay emits the following events:
- `overlayOpened`: Dispatched after an overlay is opened; bubbles and has a `detail` object with
a `name` property that corresponds to the overlay's `data-name` attribute value.
- `overlayClosed`: Dispatched after an overlay is closed; bubbles and has a `detail` object with
a `name` property that corresponds to the overlay's `data-name` attribute value.

The overlay listens to the following events (on `window`):
- `openOverlay`: Open an overlay; must contain a `detail` object with a `name` property that
corresponds to the overlay's name.
- `closeOverlay`: Close an overlay; must contain a `detail` object with a `name` property that
corresponds to the overlay's name.


### Overlay Button

#### Exposed Element
`<overlay-button-component></overlay-button-component>`

#### Attributes
- `data-overlay-name` (required, `String`): Contains the name of the overlay that should be opened
or closed. Make sure it exactly matches the attribute `data-name` on `overlay-component`.
- `data-type` (required, `String`): Is either `close`, if the button shall only close the overlay,
`open` if the button shall only open the overlay or `toggle` if the button shall toggle the
overlay. Defaults to `toggle`.
- `data-open-class-name` (optional, `String`): Class name that will be added to the button when
the overlay is opened.
- `data-closed-class-name` (optional, `String`): Class name that will be added to the button when
the overlay is closed.

### Overlay (Class)

The original `Overlay` class is exposed in order to extend it.

#### Usage
```
import Overlay from '@joinbox/overlay/Overlay.js'

class CustomOverlay extends Overlay {
    …
}
```


## Migration

## From v1 to v2
- Events `openOverlay` and `closeOverlay` (emitted **after** the overlay is opened or closed)
are renamed to `overlayOpened` and `overlayClosed` (because the original events are now used to
open or close the overlay, not to communicate its state change retrospectively)