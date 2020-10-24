// Checkbox
// Radio
// Input
// Button
// Dropdown

<FormElementsSync
    data-submit-on-change="true"
    data-submit-debounce="500"
    data-form-group-selector="[data-drupal-selector='views-exposed-form-articles-default']"
    data-form-element-selector="[data-drupal-selector='edit-field-categories']"
>
  <ul>
    <template>
      // textContent of elements with data-label is taken from original form
      <span data-label>textContent is replaced with the form element's label due to data-label attribute</span>
      // Element gets checked attribute when original is checked. The (only) input in the <template> is synced
      // with the form's original input
      <input type="radio" data-active-attribute='[["checked"]]' />
      // Element gets --active class and data-checked="true" if form element is checked
      <span class="title" data-active-attributes='[["data-checked", "true"],["class", "--active"]]'></span>
    </template>
  </ul>
</FormElementsSync>