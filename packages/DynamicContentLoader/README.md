# Dynamic Page Loader

Components that are able to load and handle asynchronously loaded content in an orchestrated way. 
- support loading indicator
- supports error handling

## Example

```html
<async-loader
    data-endpoint-url="/testContent.html"
    data-trigger-event-names="loadData1,loadData2"
    data-trigger-event-filter="(event.type === 'loadData1' && event.detail.loadAsync === true) || event.type === 'loadData2'"
>
    <div data-content-container>Initial Content</div>
    <template data-loading-template>Loading ...</template>
    <template data-error-template>Error: {{message}}</template>
</async-loader>

<button class="regularContentButton">Load</button>

<script>
    document.querySelector('.regularContentButton').addEventListener('click', () => {
        const options = { bubbles: true, detail: { loadAsync: true } };
        window.dispatchEvent(new CustomEvent('loadData', options));
    });
</script>
```

## Components

### Async Loader

#### Exposed Element
`<async-loader></async-loader>`

#### Attributes
- `data-endpoint-url` (required if `data-event-endpoint-property-name` is not set): URL that should be fetched.
If both `data-endpoint-url` and `data-event-endpoint-property-name` are provided, `data-endpoint-url` will be preferred.
- ~~`data-trigger-event-name`~~ (deprecated): Name of the event that causes content to be loaded; it will
be listened to on `window`.
- `data-trigger-event-names` (required): Comma separated names of the events which will trigger the fetching of the content; they will
  be listened to on `window`.
- `data-event-endpoint-property-name` (required if `data-endpoint-url` is not set): Name of the property 
in the `event` payload (`detail` property of the event object) which contains the endpoint URL.
Has no effect if `data-endpoint-url` is set.
- `data-trigger-event-filter` (optional): JavaScript expression that will be evaluated against
the event if provided. Only if the event matches the expression, data will be loaded; if not, the
event will be ignored. Only one variable is passed (the `Event` thats name matches
`data-trigger-event-name`); it can be accessed through `event`.
- `data-load-once` (optional): if this boolean attribute is set, content will load only once,
no matter how many times a valid event fires.

#### Content
The following elements may or must be provided within `<aync-loader>`:
- Any element matching `[data-content-container]` (required): Content (loading, error or 
successfully fetched content) will be placed within this element after it has been emptied.
- A `template` element that matches `[data-loading-template]` (optional): Its content will be
displayed within `[data-content-container]` while data is loading.
- A `template` element that matches `[data-error-template]` (required): Its content will be
displayed within `[data-content-container]` if loading data fails; you may use a string
`{{message}}` within the template's `textContent` to display the error message.

### Events
- Dispatches `asyncLoaderFail` event if loading content fails (bubbles).
- Dispatches `asyncLoaderSuccess` event if loading content succeeds (bubbles).
- Both events carry a `detail` object with properties `url` (`String`, deprecated), `response`
(instance of [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)) and `element`
(`HTMLElement` that matches the dispatching `AsyncLoader`).
