import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['InputSync.import.js'], hideErrors });
};

const createScript = (document, content) => {
    const script = document.createElement('script');
    const contentNode = document.createTextNode(content);
    script.appendChild(contentNode);
    return script;
};


test('throws if required attributes are missing', async(t) => {
    const { document, errors } = await setup(true);

    // Missing target
    const missingTarget = createScript(document, `
        const sync = new InputSync();
        sync.setup();
    `);
    document.body.appendChild(missingTarget);
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('originalElement to be'), true);

    // Missing source
    const missingSource = createScript(document, `
        sync.setup({ originalElement: document.createElement('input') });
    `);
    document.body.appendChild(missingSource);
    t.is(errors.length, 2);
    t.is(errors[1].message.includes('clonedElement to be'), true);

    // Invalid autoSubmit
    const invalidAutoSubmit = createScript(document, `
        sync.setup({ originalElement: document.createElement('input'), clonedElement: document.createElement('input'), autoSubmit: false });
    `);
    document.body.appendChild(invalidAutoSubmit);
    t.is(errors[2].message.includes('(strings), is false'), true);
});


test('syncs elements', async(t) => {
    const { document, errors, window } = await setup(true);
    // Create source
    const source = document.createElement('input');
    source.setAttribute('type', 'checkbox');
    source.setAttribute('id', 'source');
    document.body.appendChild(source);
    // Create target
    const target = document.createElement('input');
    target.setAttribute('type', 'checkbox');
    target.setAttribute('id', 'target');
    document.body.appendChild(target);
    // Sync'em
    const script = createScript(document, `
        const sync = new InputSync();
        sync.setup({ originalElement: document.querySelector('#source'), clonedElement: document.querySelector('#target') });
    `);
    document.body.appendChild(script);

    // Syncs target to source
    target.checked = true;
    target.dispatchEvent(new window.Event('change', { bubbles: true }));
    t.is(source.checked, true);

    // Syncs source to target
    source.checked = false;
    source.dispatchEvent(new window.Event('change', { bubbles: true }));
    t.is(target.checked, false);

    // Syncs source on input event (not only change)
    target.checked = true;
    target.dispatchEvent(new window.Event('input', { bubbles: true }));
    t.is(source.checked, true);

    t.is(errors.length, 0);
});


test('Syncs on start', async(t) => {
    const { document, errors } = await setup(true);
    // Create source
    const source = document.createElement('input');
    source.setAttribute('type', 'checkbox');
    source.setAttribute('checked', 'checked');
    source.setAttribute('id', 'source');
    document.body.appendChild(source);

    // Create target
    const target = document.createElement('input');
    target.setAttribute('type', 'checkbox');
    target.setAttribute('id', 'target');
    document.body.appendChild(target);

    // Sync'em
    const script = createScript(document, `
        const sync = new InputSync();
        sync.setup({ originalElement: document.querySelector('#source'), clonedElement: document.querySelector('#target') });
    `);
    document.body.appendChild(script);

    // Syncs target to source
    t.is(target.checked, true);

    t.is(errors.length, 0);
});


test('Syncs other properties', async(t) => {
    const { document, errors, window } = await setup(true);
    // Create source
    const source = document.createElement('input');
    source.setAttribute('type', 'text');
    source.value = 'initial';
    source.setAttribute('id', 'source');
    document.body.appendChild(source);

    // Create target
    const target = document.createElement('input');
    target.setAttribute('type', 'text');
    target.setAttribute('id', 'target');
    document.body.appendChild(target);

    // Sync'em
    const script = createScript(document, `
        const sync = new InputSync();
        sync.setup({ originalElement: document.querySelector('#source'), clonedElement: document.querySelector('#target'), originalProperty: 'value' });
    `);
    document.body.appendChild(script);

    t.is(target.value, 'initial');

    target.value = 'changed';
    target.dispatchEvent(new window.Event('change', { bubbles: true }));
    t.is(source.value, 'changed');

    t.is(errors.length, 0);
});


test('Auto-submits original form', async(t) => {
    const { document, errors, window } = await setup(true);
    // Create source
    const source = document.createElement('input');
    source.setAttribute('type', 'checkbox');
    // Initial state should not cause submit
    source.checked = true;
    source.setAttribute('id', 'source');

    const sourceForm = document.createElement('form');

    const sourceSubmitButton = document.createElement('input');
    sourceSubmitButton.setAttribute('type', 'submit');
    let submitted = 0;
    sourceSubmitButton.click = () => submitted++;

    sourceForm.appendChild(source);
    sourceForm.appendChild(sourceSubmitButton);
    document.body.appendChild(sourceForm);

    // Create target
    const target = document.createElement('input');
    target.setAttribute('type', 'checkbox');
    target.setAttribute('id', 'target');
    document.body.appendChild(target);

    // Sync'em
    const script = createScript(document, `
        const sync = new InputSync();
        sync.setup({ originalElement: document.querySelector('#source'), clonedElement: document.querySelector('#target'), autoSubmit: [{ eventName: 'change' }, { eventName: 'myEvent' }] });
    `);
    document.body.appendChild(script);

    t.is(submitted, 0);

    // Submits on change of target element
    target.dispatchEvent(new window.Event('change'));
    target.dispatchEvent(new window.CustomEvent('myEvent'));
    t.is(submitted, 2);

    // Only submit if element is valid
    target.setCustomValidity('invalid state');
    target.dispatchEvent(new window.Event('change'));
    t.is(submitted, 2);

    // Don't submit if original changes
    source.dispatchEvent(new window.Event('change'));
    t.is(submitted, 2);

    t.is(errors.length, 0);
});


test('Respects debounce for auto-submit', async(t) => {
    const { document, errors, window } = await setup(true);
    // Create source
    const source = document.createElement('input');
    source.setAttribute('type', 'text');
    source.setAttribute('id', 'source');

    const sourceForm = document.createElement('form');

    const sourceSubmitButton = document.createElement('input');
    sourceSubmitButton.setAttribute('type', 'submit');
    let submitted = 0;
    sourceSubmitButton.click = () => submitted++;

    sourceForm.appendChild(source);
    sourceForm.appendChild(sourceSubmitButton);
    document.body.appendChild(sourceForm);

    // Create target
    const target = document.createElement('input');
    target.setAttribute('type', 'text');
    target.setAttribute('id', 'target');
    document.body.appendChild(target);

    // Sync'em
    const script = createScript(document, `
        const sync = new InputSync();
        sync.setup({ originalElement: document.querySelector('#source'), clonedElement: document.querySelector('#target'), autoSubmit: [{ eventName: 'myEvent', debounceTime: 50 }, { eventName: 'change' }] });
    `);
    document.body.appendChild(script);

    t.is(submitted, 0);

    // Regular submit
    target.dispatchEvent(new window.CustomEvent('change'));
    t.is(submitted, 1);

    // Debounced submit
    target.dispatchEvent(new window.CustomEvent('myEvent'));
    t.is(submitted, 1);
    await new Promise(resolve => setTimeout(resolve, 550));
    t.is(submitted, 2);

    t.is(errors.length, 0);
});



test('Submits on enter if provided', async(t) => {
    const { document, errors, window } = await setup(true);
    // Create source
    const source = document.createElement('input');
    source.setAttribute('type', 'text');
    source.setAttribute('id', 'source');

    const sourceForm = document.createElement('form');

    const sourceSubmitButton = document.createElement('input');
    sourceSubmitButton.setAttribute('type', 'submit');
    let submitted = 0;
    sourceSubmitButton.click = () => submitted++;

    sourceForm.appendChild(source);
    sourceForm.appendChild(sourceSubmitButton);
    document.body.appendChild(sourceForm);

    // Create target
    const target = document.createElement('input');
    target.setAttribute('type', 'text');
    target.setAttribute('id', 'target');
    document.body.appendChild(target);

    // Sync'em
    const script = createScript(document, `
        const sync = new InputSync();
        sync.setup({ originalElement: document.querySelector('#source'), clonedElement: document.querySelector('#target'), submitOnEnter: true });
    `);
    document.body.appendChild(script);

    t.is(submitted, 0);

    // Regular submit
    target.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'Enter' }));
    t.is(submitted, 1);
    t.is(errors.length, 0);
});
