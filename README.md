# Re-usable UI Components for and from Joinbox

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
- [Dynamic Page Loader](./DynamicPageLoader/README.md) – maybe prefer [barba.js](https://barba.js.org/)
- [once](./shared/once.mjs)

## Tests
`npm i && npm test`
