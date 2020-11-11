# Form Sync

Synchronizes forms and elements between an original form (e.g. one created by Drupal) and another
form (e.g. freely created as a template based on crazy mockups). Needed as Drupal has strict limits 
on how filter forms are structured.

Features:
- clones any number of inputs from the original form to a new container
- synchronizes original and cloned form elements
- supports auto submit on cloned form elements
- clones placeholder from original to cloned inputs (if not already set on cloned input)
- sets for attribute on label and id attribute on input (if not already set on cloned input)


## Polyfills
- Use a [template polyfill](https://github.com/webcomponents/polyfills/tree/master/packages/template)
[if needed](https://caniuse.com/#feat=template)


## Example

````html
<form id="originalForm">
    <label for="firstName">Your First Name:</label>
    <input type="text" id="firstName" />
    <div id="checkboxes">
        <label for="fish"><input type="checkbox" id="fish" checked> Fish</label>
        <label for="chicken"><input type="checkbox" id="chicken"> Chicken</label>
    </div>
    <!-- Without label -->
    <select id="dropdown">
        <option>1</option>
        <option>2</option>
        <option>3</option>
    </select>
</form>


<!-- The cloned form -->
<div id="clonedForm">
    <form-sync data-form-elements-selector="#firstName">
        <template>
            <!-- Template needs exactly one child -->
            <div>
                <!-- Original label's textContent is copied to textContent of element with
                attribute data-label -->
                <label data-label></label>
                <!-- Original's element's value is copied to element with attribute data-input -->
                <input type="text" data-input/>
            </div>
        </template>
    </form-sync>
    <form-sync data-form-elements-selector="#checkboxes input" data-auto-submit="true">
        <div>
            <h3>Checkboxes</h3>
            <!-- One template will be cloned for every input in #checkboxes -->
            <template>
                <div>
                    <label>
                        <span data-label></span>
                        <input type="checkbox" data-input/>
                    </label>
                </div>
            </template>
        </div>
    </form-sync>
    <form-sync data-form-elements-selector="#dropdown">
        <template>
            <div>
                <!-- Options will be cloned from original <select> -->
                <select data-input>
                </select>
            </div>
        </template>
    </form-sync>

    <!-- Will submit #originalForm; gets class .active when #cloned is changed for the
    first time-->
    <form-submit-button
        data-form-selector="#originalForm"
        data-change-selector="#clonedForm"
        data-changed-class-name="active"
    >
        <button>Submit</button>
    </form-submit-button>

</div>


<script type="module" src="@joinbox/ui-components/FormSync/FormSyncElement.js"></script>
<script type="module" src="@joinbox/ui-components/FormSync/FormSubmitButtonElement.js"></script>
````

## Components

### FormSync

#### Exposed Element
`<form-sync></form-sync>`

#### Attributes
- `data-auto-submit` (optional): Set to `"true"` if changing one of the input's value should auto-submit the
original form. Defaults to `false`.
- data-form-elements-selector: CSS selector for all input elements that should be cloned and synced
between the original and the cloned input.

#### Content
- Use any content you like with the following exceptions:
    - Use a `<template>` tag to provide a template for the inputs that will be selected by
      `data-form-elements-selector` and cloned. 
    - The `<template>` tag must contain **exactly** one child.
    - Provide an element with a `data-label` attribute within the template tag, if you wish. This
      element's `textContent` will be set to the original label's `textContent`.
    - You must provide an element with a `data-input` attribute within the template tag. This
      element's `changed` or `value` property will be synced with the original element.



### FormSubmitButton

#### Exposed Element
`<form-submit-button></form-submit-button>`

#### Attributes
- `data-form-selector` (mandatory): CSS selector for the form element that should be submitted
when the current element is clicked.
- `data-change-selector` (optional): CSS selector for a HTML element that should be watched for
`change` and `input` events; if any of those happens, `data-changed-class-name` will be added to
the current `form-submit-button`.
- `data-remove-disabled-on-change` (optional): If set and contains a truthy value, disabled
attribute on `<form-submit-button>` will be removed whenever a change or input event happens on 
the HTML element that matches `data-change-selector`.






## Libraries/Classes

### InputSync

Class that synchronizes two inputs (form elements). Example:

```
const sync = new InputSync();
sync.setup({
    originalElement: document.querySelector('#source'),
    clonedElement: document.querySelector('#target'),
    property: 'value',
    autoSubmit: true,
});
```

Synchronizes the property `value` of the two inputs `#source` and `#target` whenever a change event
occurs on one of them. When `setup()` is called, also copies `value` of original to cloned element
and calls `submit()` on closest `<form>` of `originalElement` whenever a `change` event occurs on
the cloned element.


