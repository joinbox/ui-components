import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['FormSubmitButtonElement.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};

test('throws if form is missing', async(t) => {
    const { document, errors, window } = await setup(true);
    const content = createElement(
        document,
        `<div>
            <form-submit-button data-form-selector="#originalForm"></form-submit-button>
        </div>`,
    );
    document.body.appendChild(content);

    document.querySelector('form-submit-button')
        .dispatchEvent(new window.Event('click', { bubbles: true }));

    t.is(errors.length, 1);
    t.is(errors[0].message.includes('with selector #originalForm'), true);
});


test('submits form', async(t) => {
    const { document, errors, window } = await setup(true);
    const content = createElement(
        document,
        `<div>
            <form id="originalForm">
            </form>
            <form-submit-button data-form-selector="#originalForm">
                <button>Submit</button>
            </form-submit-button>
        </div>`,
    );
    document.body.appendChild(content);

    let submitted = 0;
    document.querySelector('form').submit = () => { submitted++; };
    document.querySelector('button').dispatchEvent(new window.Event('click', { bubbles: true }));
    t.is(submitted, 1);

    t.is(errors.length, 0);
});


test('changed class is added on change', async(t) => {
    const { document, errors, window } = await setup(true);
    const content = createElement(
        document,
        `<div>
            <form id="originalForm">
            </form>
            <form-submit-button
                data-form-selector="#originalForm"
                data-changed-class-name="active"
                data-change-selector="#originalForm"
            >
                <button>Submit</button>
            </form-submit-button>
        </div>`,
    );
    document.body.appendChild(content);

    document.querySelector('form').dispatchEvent(new window.Event('change'));
    await new Promise(resolve => window.requestAnimationFrame(resolve));
    t.is(document.querySelector('form-submit-button').classList.contains('active'), true);

    t.is(errors.length, 0);
});


