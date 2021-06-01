# Re-usable UI Components for and from Joinbox

## Develop

### Intro
- This is a monorepo that uses lerna to publish the components as individual packages

### Init
- Run `npm run bootstrap` to initialize the whole repo locally (install NPM modules and link them)

### Release
1. Run `npm run test` to run all tests in all packages
1. Run `npm run build` in packages
1. Checkout master branch and merge develop into it
1. Run `npm run createVersion` to create new versions for all packages with changes since their last
release; versions are created automatically based on 
[conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)
1. Run `npm run release` to publish packages
1. Make sure to create a GIT tag; when versioning, conventional commits are compared to to the
most recent GIT tag.



## Use
- All components are [custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements). 
- Make sure to use the appropriate [polyfill](https://github.com/webcomponents/polyfills/tree/master/packages/custom-elements)
for [old browsers](https://caniuse.com/custom-elementsv1). If not noted otherwise, only the custom
element polyfill is needed.
- Embed the JavaScript file that ends with `Element`; it defines the custom element on `window`.
- If you are using Babel, install [regenerator-runtime](https://www.npmjs.com/package/regenerator-runtime)
and import it before the elements via `import 'regenerator-runtime/runtime.js';`

## Components
- [YouTube Player](./YouTubePlayer/README.md)
- [Overlay and Buttons](./Overlay/README.md)
- [Audio Player](./Media/README.md)
- [Table of Contents](./TableOfContents/README.md)
- [Slider](./Slider/README.md)
- [FormSync](./FormSync/README.md)

## Tools
- [Split Text](./splitText/README.md)
- [Dynamic Page Loader](./DynamicPageLoader/README.md) – use [barba.js](https://barba.js.org/) instead!
- [once](./shared/once.mjs), import as `import { once } from '@joinbox/ui-components'`
- [slide](./slide/README.md), import as `import { slide } from '@joinbox/ui-components'`
- [createDebounce](./shared/createDebounce.mjs), import as `import { createDebounce } from '@joinbox/ui-components'`

## Tests
`npm i && npm test`
