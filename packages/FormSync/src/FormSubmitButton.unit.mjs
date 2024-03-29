import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['FormSubmitButtonElement.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};

test('submits form', async(t) => {
    const { document, errors, window } = await setup(true);
    const content = createElement(
        document,
        `<div>
            <form id="originalForm">
                <input type="submit" id="originalSubmitButton">Submit</input>
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
    document.querySelector('#originalSubmitButton').click = () => {
        originalSubmitted++;
    };
    document.querySelector('#clonedForm').addEventListener('submit', () => {
        clonedSubmited++;
    });

    const button = document.querySelector('#submitButton');
    button.dispatchEvent(new window.Event('click', { bubbles: true }));

    t.is(originalSubmitted, 1);
    // Make sure event is prevented on cloned form or two forms will be sumbitted at the same time
    // which leads to a race condition.
    t.is(clonedSubmited, 0);

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

