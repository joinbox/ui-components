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
    - `validate` (`function`, optional), takes `value` as its only parameter and should return
     `true` if the value is valid, else `false`
    - `transform` (`function`, optional), takes `value` as its only parameter and should return the 
    transformed value
    - `expectation` (`string`, optional): expected value for the (transformed) value; will be
    printed in the error message if `validate` returns `false`

### Returns
`*`: Transformed and validated value

### Errors
`Error` if `validate` function returns `false`