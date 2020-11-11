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
            <form id="clonedForm">
                <form-submit-button data-form-selector="#originalForm">
                    <input type="submit" id="submitButton">Submit</input>
                </form-submit-button>
            </form>
        </div>`,
    );
    document.body.appendChild(content);

    let originalSubmitted = 0;
    let clonedSubmited = 0;
    document.querySelector('#originalForm').submit = () => { originalSubmitted++; };
    document.querySelector('#clonedForm').submit = () => { clonedSubmited++; };

    const button = document.querySelector('#submitButton');
    button.dispatchEvent(new window.Event('click', { bubbles: true }));

    t.is(originalSubmitted, 1);
    // Make sure event is prevented on cloned form or two forms will be sumbitted at the same time
    // which leads to a race condition.
    t.is(clonedSubmited, 0);

    t.is(errors.length, 0);
});


test('disabled is removed on change', async(t) => {
    const { document, errors, window } = await setup(true);
    const content = createElement(
        document,
        `<div>
            <form id="originalForm">
            </form>
            <form-submit-button
                disabled
                data-form-selector="#originalForm"
                data-remove-disabled-on-change="true"
                data-change-selector="#originalForm"
            >
                <button>Submit</button>
            </form-submit-button>
        </div>`,
    );
    document.body.appendChild(content);

    document.querySelector('form').dispatchEvent(new window.Event('change'));
    await new Promise(resolve => window.requestAnimationFrame(resolve));
    t.is(document.querySelector('form-submit-button').hasAttribute('disabled'), false);

    t.is(errors.length, 0);
});


