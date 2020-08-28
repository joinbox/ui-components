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
<script src="Overlay/OverlayElement.js"></script>
<script src="Overlay/OverlayButtonElement"></script>
````

## Components

### Overlay

#### Exposed Element
`<overlay-component></overlay-component>`

#### Attributes
- `data-name`: Names the overlay; the name must exactly match attribute `data-overlay-name` on
`overlay-button-component` to be opened/closed by it.
- `data-visible-class-name`: Contains the class name that will be added to the overlay when it is
opened and removed when it is closed.
- `data-background-selector`: Takes any CSS selector and defines the element that will receive
`data-background-visible-class-name` when the overlay opens.
- `data-background-visible-class-name`. Defines the class that will be added to the background
element when the overlay is opened and removed when the overlay is closed.
- `data-disable-esc`: Prevents the overlay from being closed when users press the ESC key. Defaults
to false.
- `data-disable-click-outside`: Prevents the overlay from being closed when users click with their
mouse outside of the overlay. Defaults to false.



### Overlay Button

#### Exposed Element
`<overlay-button-component></overlay-button-component>`

#### Attributes
- `data-overlay-name`: Contains the name of the overlay that should be opened or closed. Make sure
it exactly matches the attribute `data-name` on `overlay-component`.
- `data-type` is either `close`, if the button shall only close the overlay, `open` if the button
shall only open the overlay or `toggle` if the button shall toggle the overlay. Defaults to
`toggle`.

