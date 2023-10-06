# Relative Time

Displays relative time (e.g. '3 days ago') in a custom element. Uses best guesses to decide what
unit (e.g. day, week etc.) to use.

## Advantages
- Good test coverage
- Custom element (no vendor dependencies)
- Small file size
- Uses standard JS functionality ([Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat)) with [broad browser support](https://caniuse.com/mdn-javascript_builtins_intl_relativetimeformat)
- Use within a HTML `<time>` element to get optimum semantics

## Example

```html
<!-- Use browser's locale -->
<relative-time data-time="2023-03-02 10:00:03">2023-03-02</relative-time>

<!-- Use de as locale -->
<relative-time data-time="2023-03-02 10:00:03" data-locale="de">March 2023</relative-time>

<!-- Embed script-->
<script type="module">
    import @joinbox/relative-time;
</script>
```

## Components

### Relative Time

#### Exposed Element
`<relative-time></relative-time>`

#### Attributes
- `data-time` (required): A time string that can be [parsed by new Date()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format)). Relative time will be calculated in 
relation to the current time.
- `data-locale` (optional): A BCP 47 language tag or an Intl.Locale instance (see [documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/RelativeTimeFormat))

### Events
No events are fired.