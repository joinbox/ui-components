# SplitText

Splits textContent of an HTML element into multiple parts for
- letters
- words
- lines

Supports:
- custom functions that wrap the parts into any text provided
- indices on all types of parts (letters, words and lines)
- restoring to original content
- restore on resize and updated split after a certain debounce
- content that contains nested elements; in order for them to work with `wrapLine` make sure
that they are `display: inline-block`

By default, all types are wrapped into a `span` with class `letter`, `word` or `line` and an 
attribute `data-letter-index`, `data-word-index` or `data-line-index` with the corresponding
index that counts up (per HTML element).

### VERY Important
- In order for `wrapLine` to work, you **may not** use `false` as the value for 
`wrapWord`; in other words, every word **must** be wrapped for `wrapLine` to work! Why's that?
When wrapping lines, we go through all child elements and compare their vertical position
in the rendered document; once the vertical position changes, a new line is assumed. If there
are no children within the element, we can't go through them; and if you wrap only letters, a
line break may happen after every letter.
- In order to prevent words from breaking, apply `display: inline-block` on them.
- `splitText` does – due to JS restrictions – not work with hyphens. To prevent layout shifts, use
e.g. `hyphens: none` in your CSS for elements that `splitText` will be applied to.

## Example

```html
<div>This is Content.</div>
```

```javascript
import splitText from '@joinbox/splittext';
const restore = splitText({
    element: document.querySelector('div'),
    // Pass a custom wrapper function
    wrapLetter: (content, index) => `<div class='my-letter' style='--splitTextIndex: ${index}'>${content}</div>`,
    // Don't wrap words
    wrapWord: false,
    // Prevent restore and update on resize
    updateOnResize: false,
});
// Restore content of div to original content; this destroys the elements created by splitText.
restore();
```


## Usage

### Arguments
Pass arguments as an object. The following properties are supported: 
- `element` (required): the HTML element whose `textContent` will be split and wrapped
- `wrapLetter`, `wrapWord` and `wrapLine`: 
    - either `false` if parts should not be wrapped at this level
    - or a function that takes two arguments `content` and `index` and is expected to return a
    string. Defaults to a function (see above).
- updateOnResize: `boolean` (`true` updates on x and y axis changes, false does never update) or
  the axis or axes that should trigger the update, i.e. `['x']`, `['y']` or `['x', 'y']`. Why?
  Because mobile browsers often change the viewport height when scrolling (because the show or
  hide the address bar) which causes splitText to update unnecessarily.

### Return Value

Returns a function that, when called, destroys all elements created by splitText. Try to use it
as soon as the animations splitText was used for is done to ensure the text is as responsive
as possible again.