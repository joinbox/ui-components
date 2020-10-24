# Dynamic Page Loader

Loads content of a web page dynamically when the user navigates to a different URL. It thereby
enables seamless page transitions between two different static web pages, similar to the ones
provided by Next.js or Gatsby.

. Supports:
- Elements that are preserved in the DOM when the page changes (`data-preserve-id`)
- Hook to test if the given URL should be loaded dynamically
- Hook to execute a script before the page content is changed (e.g. for animations)
- Hook to execute a script after the page content was changed (e.g. for animations)
- Only adds dynamic click handler to elements once (to not fire url change multiple times for
elements that are preserved over a page change)

## Attention!
- For now only modifies HTMLElements – and no other node types (text, comments, etc.)

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
    applyAttributes,
} from '@joinbox/ui-components/DynamicPageLoader';

// Prevents loading of a new page when a link is clicked. Uses pushState to update the URL 
// displayed by the browser instead and emits 'urlchange' event that will be handled later.
handleLinkClicks({
    // In this case, we hijack all clicks on regular links
    linkElements: document.querySelectorAll('a'),
    // Limit the links that are hijacked; in this case, only use dynamic page loader for absolute
    // links (on current domain)
    checkLink: link => link.startsWith('/'),
});

// Handles navigation through the back button and emits 'urlchange' event if the previous page
// was loaded dynamically.
handlePopState();


// Add event listener to 'urlchange' event that was fired above. Handle URL change with a smooth
// transition instead of a hard page load.
window.addEventListener(
    'urlchange',
    async(ev) => {
        const { url } = ev.detail;
        const dom = await loadFile(url);

        // If you like, add some nice animations here.

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
            updateAttributes: applyAttributes,
        });

        // Update head
        applyChanges({
            originalNode: document.querySelector('head'),
            newNode: dom.querySelector('head'),
            canBeIdentical,
            isIdentical,
            updateNode,
            updateAttributes: applyAttributes,
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
the element **might** be preserved (`isIdentical` might return true). Only needed to improve speed.
- `isIdentical`: function that takes two parameters (both `HTMLElement`s) and returns true if both
elements are **considered** identical. The original element will be preserved in the DOM, the new
element will be ignored.
- `updateNode` (optional): function that takes a single parameter (`HTMLElement`) and is expected
to return a modified HTMLElement, if you wish to change the HTMLElement before it is added to the
DOM. Needed to e.g. create a `<script>` element from scratch to make sure it is executed.
- `updateAttributes` (optional): function that takes two parameters (`newElement, originalelement`,
both `HTMLElement`s) and copies attributes from preserved `newElement` to `originalElement`. By
default, `applyChanges` does not update attributes on preserved elements.


### canBeIdentical

A default function for the `canBeIdentical` argument of `applyChanges`. Returns true if
- both elements are `link` or `meta` elements
- element has an attribute `data-preserve-id`.


### isIdentical

A default function for the `isIdentical` argument of `applyChanges`. Returns true if
- both elements are `link` or `meta` elements and have exactly the same attributes
- both elements have a `data-preserve-id` attribute that is identical.


### applyAttributes

A default function for the `updateAttributes` argument of `applyChanges`. Copies all **changed or
new** attributes from `origin` to `target` and removes the ones from `target` that are not present
on `origin`.
