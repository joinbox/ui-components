# Slider

Simple slider for scrollable panes. Does
- support scroll buttons (previous/next) anywhere in the DOM
- update scroll button visibility depending on scroll position
- make sure that an active element is visible on initialization


## Example

````html
<div class="back">←</div>
<slider-component
    data-previous-button-selector=".back"
    data-next-button-selector=".forward"
    data-disabled-button-class-name="disabled"
    data-active-content-selector=".active"
>
    <div class="element">Test</div>
    <div class="element">Test</div>
    <div class="element">Test</div>
    <div class="element active">Test</div>
    <div class="element">Test</div>
</slider-component>
<div class="forward">→</div>

<script type="module" src="Slider/SliderElement.js"></script>
````

## Components

### Slider Component

#### Exposed Element
`<slider-component></slider-component>`

#### Attributes
- `data-previous-button-selector` (optional): CSS selector for the button that scrolls to the
previous view. The button may be placed anywhere in the DOM.
- `data-next-button-selector` (optional): See `data-previous-button-selector`, but for the next
view.
- `data-disabled-button-class-name` (optional): Class name that should be added to buttons that are
disabled (depending on the scroll position; if the scroll position is 0, this class will be added to
the *previous* button, as user cannot scroll any more towards the previous view).
- `data-active-content-selector` (optional): CSS selector for the active element; the element must
be a child of `<slider-component>` and will be scrolled into view on initialization.

