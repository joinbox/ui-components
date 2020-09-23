# Dynamic Page Loader

Loads content of a page dynamically when the user navigates to a different URL. Supports:
- Elements that are preserved in the DOM when the page changes (`data-preserve-id`)
- Hook to test if the given URL should be loaded dynamically
- Hook to execute a script before the page content is changed (e.g. for animations)
- Hook to execute a script after the page content was changed (e.g. for animations)
- Only adds dynamic click handler to elements once (to not fire url change multiple times for
elements that are preserved over a page change)

## Important

There are certain limitations concerning the use of JavaScript, as the global scope is preserved
over page loads:
- Don't use any global variables or functions, especially not `const`s (would throw an already
declared error). Use [IFFEs](https://developer.mozilla.org/en-US/docs/Glossary/IIFE) e.g. where
appropriate.
- Don't use `type="module"` script tags for code that should be executed on page load. Module
script tags will only execute when the page is initially loaded.

Be aware that CSS is handled differently:
- The sort order of `<link>` elements will not be adjusted to the element order of the new page,
as moving `<link>` elements around causes flickering.

## Example

````javascript
import {
    applyChanges,
    handleLinkClicks,
    handlePopState,
    loadFile,
    createNode,
    canBeIdentical,
    isIdentical,
} from '@joinbox/ui-components/DynamicPageLoader';

// Get all links 
const links = document.querySelectorAll('a');

handleLinkClicks({
    linkElements: links,
    // Ignore all links that contain 'joinbox.com'
    checkLink: link => !link.includes('joinbox.com'),
});
handlePopState();

window.addEventListener(
    'urlchange',
    async(ev) => {
        const { url } = ev.detail;
        const dom = await loadFile(url);

        // <script> tags must be created through document.createElement and appended to DOM in order
        // to be executed; we generally use innerHTML to change DOM, which does not execute script
        // elements.
        const updateNode = node => (node.tagName === 'SCRIPT' ? createNode(document, node) : node);

        // Update body
        applyChanges({
            originalNode: document.querySelector('body'),
            newNode: dom.querySelector('body'),
            canBeIdentical,
            isIdentical,
            updateNode,
        });

        // Update head
        applyChanges({
            originalNode: document.querySelector('head'),
            newNode: dom.querySelector('head'),
            canBeIdentical: element => element.hasAttribute('data-preserve-id'),
            isIdentical: (a, b) => a.dataset.preserveId === b.dataset.preserveId,
            updateNode,
        });

        // To update a preserved DOM element, use a minimal timeOut; if we add the class while
        // the DOM element is being moved, transitions will not happen.
        setTimeout(() => {
            const method = url.includes('about') ? 'add' : 'remove';
            document.querySelector('.header').classList[method]('about');
        });

    },

    // Note once here which is crucial; window will persist over all page changes. If we add
    // the urlchange handler every time, it will fire many times after many page reloads.
    { once: true },
);
````



## Functions

### handleLinkClicks

Adds click event listener to `linkElements` passed in; executes `pushState` on click and dispatches
`urlchange` event on `window`.

#### Parameters
- `linkElements`: iterable collection of DOM elements (i.e. links) whose behaviour should be
'hijacked' and not trigger a page refresh in the browser.
- `checkLink`: function that takes a single parameter `url` that corresponds to the link's `href``
attribute. Return falsy value if the link should be handled by the browser and not by
DynamicPageLoader.



### handlePopState

Dispatches a `urlchange` event on window when a `popState` event occurs on `window`.

#### Parameters
None



### loadFile

Loads a remote file (through `fetch`) and returns its content as a DOM tree.

#### Parameters
- `url`: URL to load



### createNode

Takes a HTMLElement and creates a new element (through `document.createElement`) with the same
tag name and attributes. Needed to e.g. create a proper `script` tag.

#### Parameters
- `document`: reference to the document that the element should be created for
- `node`: HTMLElement that should be cloned/created



### applyChanges

Takes two DOM nodes and applies the changes from `newNode` to `originalNode`.

#### Parameters
- `originalNode`: HTMLElement that will be patched with the changes in newNode
- `newNode`: HTMLElement whose contents will be added to/removed from `originalNode`
- `canBeIdentical`: function that thakes a single parameter element (`HTMLElement`); return true if
the element might be preserved (if `isIdentical` returns true). Only needed to improve speed.
- `isIdentical`: function that takes two parameters (both `HTMLElement`s) and returns true if both
elements are considere identical.
- `updateNode` (optional): function that takes a single parameter (`HTMLElement`) and is expected
to return a modified HTMLElement, if you wish to change the HTMLElement before it is added to the
DOM.


### canBeIdentical

Takes a single `HTMLElement` and returns true if it **might** be identical with another element,
e.g. if it has a parameter `data-preserve-id`. If you like, you can use your own function instead,
e.g.

```javascript
const canBeIdentical = element => element.hasAttribute('data-preserve-id'),
```


### isIdentical

Takes two `HTMLElements` and returns true if they are considered identical. You can use your own
function to check if two elements are identical, e.g.

```javascript
const isIdentical = (a, b) => a.dataset.preserveId === b.dataset.preserveId,
```
