# Table of Contents

Table of contents component that
- displays any elements that match an arbitrary selector
- supports templating
- scrolls smoothly
- adds anchor links if desired

## Polyfills
- Use a [template polyfill](https://github.com/webcomponents/polyfills/tree/master/packages/template)
[if needed](https://caniuse.com/#feat=template)
- Use a [scrollIntoView polyfill](https://github.com/iamdustan/smoothscroll)
[if needed](https://caniuse.com/#feat=scrollintoview)


## Example

````html
<h1 class="toc">Table of Contents</h1>
<table-of-contents-component
    data-chapters-selector="h1:not(.toc)"
    data-template-selector="template"
    data-template-content-selector=".text"
    data-template-link-selector="a"
>
    <ul>
        <template>
            <li>
                <a href="#">
                    <span>Go to</span>
                    <span class="text"></span>
                </a>
            </li>
        </template>
    </ul>
</table-of-contents-component>'

<h1>First Title</h1>
<p>Some long content …</p>
<h1>Second title</h1>
<p>Some long content …</p>

<script type="module" src="TableOfContentsElement/TableOfContentsElement.js"></script>
````

## Components

### TableOfContentsElement

#### Exposed Element
`<table-of-contents-component></table-of-contents-component>`

#### Attributes
- `data-chapters-selector`: CSS selector for all contents that should be displayed in the 
table of contents. All matching element's `textContent` will be added to the toc.
- `data-template-selector`: CSS selector for the template within the
`<table-of-contents-component>`. Use a [`<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template)
tag that is not visible in the browser. All contents will be **appended** to the **parent** of this
element. It is important, that this element only contains **one direct descendant** (where the
click event listener will be added to).
- `data-template-content-selector`: CSS selector for an element within the element that matches
`data-template-selector`. Its `textContent` will be replaced with the `textContent` of a content
element (see `data-chapters-selector`).
- `data-template-link-selector` (optional): CSS selector for an element within the element that
matches `data-template-selector`. If provided, an id will be added to the corresponding content
element (if it does not already exist) and a matching href (anchor link) will be added to the
table of contents entry.
- `data-offset-selector` (optional): CSS selector for an element whose height will be used as scroll offset.
Helpful if there is e.g. a sticky menu at the top of the screen to prevent elements from scrolling
behind it.
