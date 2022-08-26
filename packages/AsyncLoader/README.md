# Async Loader

Component that fetches contents asynchronously and displays it when ready:
- support loading indicator
- supports error handling

## Example

```html
<async-loader
    data-endpoint-url="/testContent.html"
    data-trigger-event-name="loadData"
    data-trigger-event-filter="event.detail.loadAsync === true"
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
- `data-endpoint-url` (required): URL that should be fetched
- `data-trigger-event-name` (required): Name of the event that causes content to be loaded; it will
be listened to on `window`.
- `data-trigger-event-filter` (optional): JavaScript expression that will be evaluated against
the event if provided. Only if the event matches the expression, data will be loaded; if not, the
event will be ignored. Only one variable is passed (the `Event` thats name matches
`data-trigger-event-name`); it can be accessed through `event`.

#### Content
The following elements may or must be provided within `<aync-loader>`:
- Any element matching `[data-content-container]` (required): Content (loading, error or 
successfully fetched content) will be placed within this element after it has been emptied.
- A `template` element that matches `[data-loading-template]` (optional): Its content will be
displayed within `[data-content-container]` while data is loading.
- A `template` element that matches `[data-error-template]` (required): Its content will be
displayed within `[data-content-container]` if loading data fails; you may use a string
`{{message}}` within the template's `textContent` to display the error message.