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

By default, all types are wrapped into a `span` with class `letter`, `word` or `line` and an 
attribute `data-letter-index`, `data-word-index` or `data-line-index` with the corresponding
index that counts up (per HTML element).

### Important
- In order for `wrapLine` to work, you **may not** use `false` as the value for 
`wrapLetter`; in other words, every letter must be wrapped for `wrapLine` to work!
- `splitText` does – due to JS restrictions – not work with hyphens. To prevent layout shifts, use
e.g. `hyphens: none` in your CSS for elements that splitText will be applied to.

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
- updateOnResize: `boolean`, defaults to true.

### Return Value

Returns a function that, when called, destroys all elements created by splitText. Try to use it
as soon as the animations splitText was used for is done to ensure the text is as responsive
as possible again.