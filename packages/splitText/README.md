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
- content that contains nested elements (see "Background" below); in order for them to work with
`wrapLine` make sure that they are `display: inline-block`

By default, all types are wrapped into a `span` with class `letter`, `word` or `line` and an 
attribute `data-letter-index`, `data-word-index` or `data-line-index` with the corresponding
index that counts up (per HTML element).

### VERY Important
- `splitText` does – due to the way browsers hyphenate text – not work with hyphens. To prevent
layout shifts and wrong hyphenation, use the CSS instruction `hyphens: none` for all elements 
that you apply `splitText` to.
- In order for `wrapLine` to work, you **may not** use `false` as the value for 
`wrapWord`; in other words, every word **must** be wrapped for `wrapLine` to work (see "Background"
below). 
- In order to prevent words from breaking at random characters at the end of a container,
apply `display: inline-block` on all words.
- In order to apply CSS `transform` instructions to an element, use `display: inline-block` on the
affected elements (`transform` does not work on `display: inline`).
- Do not use `display: inline-block` on lines: If a paragraph contains a `<br/>`, it would be
ignored as inline-blocks are placed next to each other.

## Example

```html
<div class="split-me">This is Content.</div>
```

```javascript
import splitText from '@joinbox/splittext';
const restore = splitText({
    element: document.querySelector('div'),
    // Pass a custom wrapper function
    wrapLetter: (content, index) => `<div class='my-letter' style='--splitTextIndex: ${index}'>${content}</div>`,
    // Don't wrap lines; if you wrap lines, you *must* also wrap words
    wrapLine: false,
    // Prevent restore and update on resize
    updateOnResize: false,
});
// Restore content of div to original content; this destroys the elements created by splitText.
restore();
```

```css
.split-me {
    /* Don't hyphenate text; we cannot query browser-added hyphens through JS */
    hyphens: none;
}
.my-letter {
    /* Allows you to use transform on a letter */
    display: inline-block;
}
/* Line is not used in the example above; this is for documentation purposes only */
.line {
    /* Do not use inline-block for lines as it will swallow <br/>s within a line */
    display: block;
}
.word {
    /* Allows you to use transform on a word and prevents wrong line breaks */
    display: inline-block;
}
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


## Background
- Splitting into lines fails when a (child) element stretches over more than **one** line: We
would have to split that (child) element into multiple elements, one per line that the child
element occupies which would get (very) messy.
- Why do we have to use `wrapWord` in order for `wrapLine` to work? When wrapping lines, we 
go through all child elements and compare their vertical position
in the rendered document; once the vertical position changes, a new line is assumed. If there
are no children within the element, we can't go through them; and if you wrap only letters, a
line break may happen after every letter.