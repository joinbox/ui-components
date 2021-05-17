# Slide

Sets height in px on an element to allow for smooth CSS transitions (that do not work from/to
`auto`). 

## Example

````javascript
import { slide } from '@joinbox/ui-components';

const element = document.querySelector('.js-sliding-element');

// Sets height on element to current offsetHeight (in px), then to its scrollHeight; as soon as
// the transition is done, sets it to 'auto'
slide({ element });

// Sets width of element to its current offsetWidth (in px), then to 200px.
slide({ element, targetSize: 200, dimension: 'x' });
````

## Details

1. Sets height/width of the element to its current offset height/width
2. Afterwards sets height/width of element to the desired target height/width; if no `targetSize``
is specified, uses scroll height/width instead.
3. If the final (offset) height/width (on `transitionend`) corresponds to the element's scroll
height/width, its height/width is reset to 'auto' (to stay responsive)

### Arguments
Pass all arguments as an object.

- `element` The HTML element whose height/width should be updated
- `dimension` (optional): Either 'x' (to update the element's width) or 'y' (to update the element's
height). Defaults to 'y'.
- `targetSize`(optional): A number; will be used to set the element's height/width to the provided
size. If argument is not passed, the element's scroll width/height will be used.