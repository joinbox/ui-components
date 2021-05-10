import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['submitForm.import.js'], hideErrors });
};

const createScript = (document, content) => {
    const script = document.createElement('script');
    const contentNode = document.createTextNode(content);
    script.appendChild(contentNode);
    return script;
};

test('throws if form is missing', async(t) => {
    const { document, errors } = await setup(true);
    const script = createScript(document, `
        submitForm();
    `);
    document.body.appendChild(script);

    t.is(errors.length, 1);
    t.is(errors[0].message.includes('valid HTMLFormElement'), true);
});

test('throws if submit button is missing', async(t) => {
    const { document, errors } = await setup(true);
    const form = document.createElement('form');
    document.body.appendChild(form);
    const script = createScript(document, `
        submitForm(document.querySelector('form'));
    `);
    document.body.appendChild(script);

    t.is(errors.length, 1);
    t.is(errors[0].message.includes('Original submit button'), true);
});

test('submits input', async(t) => {
    const { document, errors } = await setup(true);
    const form = document.createElement('form');
    const button = document.createElement('input');
    button.setAttribute('type', 'submit');
    let submitted = 0;
    button.addEventListener('click', () => submitted++);
    form.appendChild(button);
    document.body.appendChild(form);
    const script = createScript(document, `
        submitForm(document.querySelector('form'));
    `);
    document.body.appendChild(script);
    t.is(submitted, 1);
    // JSDOM has not implemented submit on HTMLFormElement; it's not an issue, but it throws an
    // error
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('Not implemented'), true);
});

test('submits button', async(t) => {
    const { document, errors } = await setup(true);
    const form = document.createElement('form');
    const button = document.createElement('button');
    button.setAttribute('type', 'submit');
    let submitted = 0;
    button.addEventListener('click', () => submitted++);
    form.appendChild(button);
    document.body.appendChild(form);
    const script = createScript(document, `
        submitForm(document.querySelector('form'));
    `);
    document.body.appendChild(script);
    t.is(submitted, 1);
    // JSDOM has not implemented submit on HTMLFormElement; it's not an issue, but it throws an
    // error
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('Not implemented'), true);
});



