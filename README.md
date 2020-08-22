# Re-usable UI Components for and from Joinbox

## Use
- All components are [custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements). 
- Make sure to use the appropriate [polyfill](https://github.com/webcomponents/polyfills/tree/master/packages/custom-elements)
for old browsers. Only the custom element polyfill is needed.
- Embed the JavaScript file that ends with `Element`; it defines the custom element on `window`.

## Components
- [YouTube Player](./YouTubePlayer/README.md)
- [Overlay and Buttons](./Overlay/README.md)
- [Audio Player](./Media/README.md)

## Tests
`npm i && npm test`
