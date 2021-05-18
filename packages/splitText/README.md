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

## Example

```html
<div>This is Content.</div>
```

```javascript
import splitText from '@joinbox/splittext';
const restore = splitText({
    element: document.querySelector('div'),
    // Pass a custom wrapper function
    wrapLetter: (content, index) => `<div class='my-letter' data-index='${index}'>${content}</div>`,
    // Don't wrap words
    wrapWords: false,
    // Prevent restore and update on resize
    updateOnResize: false,
});
// Restore content of div to original content
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
