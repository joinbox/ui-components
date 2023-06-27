# Tools

Provides some simple and regularily used frontend helpers for JavaScript.

## readAttribute

### Description
Reads, transforms and validates an attribute from an HTML element.

### Usage

```
import { readAttribute } from '@joinbox/ui-tools';

const element = document.querySelector('div.className');
readAttribute(element, 'attributeName', { transform: (value) => parseInt(value, 10) });
```

### Arguments

Syntax: `readAttribute(element, attribute, additionalArguments)`;

- `element` (`HTMLElement`, required): Element to read attribute from
- `attribute` (`string`, required): Name of the attribute to read
- `additionalArguments` (`object`, optional): Object with properties
    - `transform` (`function`, optional), takes `value` as its only parameter and should return the 
    transformed value
    - `validate` (`function`, optional), takes `value` as its only parameter (that is the
    attribute's value *after* the `transform` function has been applied) and should return `true`
    if the value is valid, else `false`
    - `expectation` (`string`, optional): expected value for the (transformed) value; will be
    printed in the error message if `validate` returns `false`

### Returns
`*`: Transformed and validated value

### Errors
`Error` if `validate` function returns `false`



## createDebounce

### Description
Creates a debounced function

### Usage

```
import { createDebounce } from '@joinbox/ui-tools';

const debounce = createDebounce();
// Will only print a console.log after the window has *not* been resized for 200ms
window.addEventListener('resize', debounce(() => console.log(window.innerWidth), 200));
```

### Arguments

- None

### Returns
`function`: A function that takes two arguments: `callback` (`function`, required) and 
`timeout` (`number`, required). The `callback` will only be executed after it has not been
called for `timeout` ms.



## once

### Description
Only executes a given function once for a given element; the execution state (executed or not) is
stored on an HTML element and only depends on the provided `name`, not the `function`. Needed
especially to implement Drupal behaviors.

### Usage

```
import { once } from '@joinbox/ui-tools';

const executeOnlyOnce = () => { console.log('executing'); };
const element = document.querySelector('.executing-element');
once(element, 'example-executer', executeOnlyOnce);

// Will *not* execute executeOnlyOnce because it has been executed for this element before
once(element, 'example-executer', executeOnlyOnce);

// Will *not* execute because the name has been used before
once(element, 'example-executer', () => { console.log('nope') });

// Will execute as executeOnlyOnce has not been executed for this element before
once(document.querySelector('body'), 'example-executer', executeOnlyOnce);
```

### Arguments

Syntax: `once(element, name, function)`

- `element` (`HTMLElement`, required): The HTML element for which the `function` should be executed
once
- `name` (`string`, required): Name under which the execution state function (executed or not)
will be stored on the provided `element`
- `function` (`function`, required): Function that shall only be executed once


