import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['FormSyncElement.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};

test('creates and syncs checked inputs', async(t) => {
    const { document, errors, window } = await setup(true);
    const original = createElement(
        document,
        `<form>
            <label for="chickenInput">Chicken</label>
            <input type="radio" id="chickenInput" value="chicken" />
            <label for="fishInput">Fish</label>
            <!-- Also works with label for name attribute -->
            <input type="radio" name="fishInput" value="fish" />
        </form>`,
    );
    document.body.appendChild(original);
    const clone = createElement(
        document,
        `<form-sync data-form-elements-selector="form input">
            <h1>Some content</h1>
            <template>
                <div>
                    <label class="label-clone" data-label></label>
                    <input class="input-clone" type="radio" data-input />
                </div>
            </template>
        </form-sync>`,
    );
    document.body.appendChild(clone);

    await new Promise(resolve => window.requestAnimationFrame(resolve));

    // H1 was preserved
    t.is(document.querySelectorAll('form-sync h1').length, 1);

    // Both inputs (and therefore labels) were cloned
    t.is(document.querySelectorAll('.input-clone').length, 2);

    // Label was cloned
    t.is(document.querySelector('.label-clone').textContent, 'Chicken');

    // Value is synced
    const firstInput = document.querySelector('.input-clone');
    firstInput.checked = true;
    firstInput.dispatchEvent(new window.Event('change'));
    t.is(document.querySelector('#chickenInput').checked, true);
    t.is(errors.length, 0);
});


test('works with selects', async(t) => {
    const { document, errors, window } = await setup(true);
    const original = createElement(
        document,
        `<select id="mySelect">
            <option>1</option>
            <option>2</option>
        </select>`,
    );
    document.body.appendChild(original);
    const clone = createElement(
        document,
        `<form-sync data-form-elements-selector="#mySelect">
            <template>
                <div>
                    <select data-input id="selectClone"></select>
                </div>
            </template>
        </form-sync>`,
    );
    document.body.appendChild(clone);

    await new Promise(resolve => window.requestAnimationFrame(resolve));

    // Options were cloned
    const select = document.querySelector('#selectClone');
    t.is(select === null, false);
    t.is(select.children.length, 2);
    t.is(select.children[0].outerHTML, '<option>1</option>');

    // Change is synced
    select.value = '2';
    select.dispatchEvent(new window.Event('change'));
    t.is(document.querySelector('#mySelect').value, '2');

    t.is(errors.length, 0);
});


test('works with auto-submit attribute', async(t) => {
    const { document, errors, window } = await setup(true);
    const original = createElement(
        document,
        `<form>
            <input type="text" id="originalText" />
            <input type="submit" id="originalSubmit" />
        </form>`,
    );
    document.body.appendChild(original);
    const clone = createElement(
        document,
        // Use quite an invalid auto-submit parameter
        `<form-sync data-form-elements-selector="#originalText" data-auto-submit="some ,  change, other,">
            <template>
                <div>
                    <input type="text" id="cloneText" data-input>
                </div>
            </template>
        </form-sync>`,
    );
    document.body.appendChild(clone);

    await new Promise(resolve => window.requestAnimationFrame(resolve));

    let submitted = 0;
    document.querySelector('#originalSubmit').click = () => { submitted += 1; };

    // Change is synced
    const input = document.querySelector('#cloneText');
    input.value = 'newValue';
    input.dispatchEvent(new window.Event('change', { bubbles: true }));
    t.is(submitted, 1);

    t.is(errors.length, 0);
});


test('clones placeholder', async(t) => {
    const { document, errors, window } = await setup(true);
    const original = createElement(
        document,
        '<input type="text" id="originalText" placeholder="Mathilda" />',
    );
    document.body.appendChild(original);
    const clone = createElement(
        document,
        `<form-sync data-form-elements-selector="#originalText">
            <template>
                <div>
                    <input type="text" id="cloneText" data-input>
                </div>
            </template>
        </form-sync>`,
    );
    document.body.appendChild(clone);

    // Don't overwrite existing placeholder
    const withPlaceholder = createElement(
        document,
        `<form-sync data-form-elements-selector="#originalText">
            <template>
                <div>
                    <input type="text" id="inputWithPlaceholder" data-input placeholder="Original">
                </div>
            </template>
        </form-sync>`,
    );
    document.body.appendChild(withPlaceholder);

    await new Promise(resolve => window.requestAnimationFrame(resolve));

    t.is(document.querySelector('#cloneText').getAttribute('placeholder'), 'Mathilda');
    t.is(document.querySelector('#inputWithPlaceholder').getAttribute('placeholder'), 'Original');

    t.is(errors.length, 0);
});


test('connects label to input via for and id attributes', async(t) => {
    const { document, errors, window } = await setup(true);
    const original = createElement(
        document,
        `<div>
            <input type="text" id="originalInput" />
        </div>`,
    );
    document.body.appendChild(original);

    // Don't modify existing for attribute on label
    const withFor = createElement(
        document,
        `<form-sync data-form-elements-selector="#originalInput">
            <template>
                <div>
                    <label data-label id="labelWithFor" for="notModified"></label>
                    <input data-input />
                </div>
            </template>
        </form-sync>`,
    );
    document.body.appendChild(withFor);

    // Don't modify existing for attribute on label
    const withoutFor = createElement(
        document,
        `<form-sync data-form-elements-selector="#originalInput">
            <template>
                <div>
                    <label data-label id="labelWithoutFor"></label>
                    <input data-input class="inputForLabelWithoutFor"/>
                </div>
            </template>
        </form-sync>`,
    );
    document.body.appendChild(withoutFor);

    // Use ID of input if it exists
    const withId = createElement(
        document,
        `<form-sync data-form-elements-selector="#originalInput">
            <template>
                <div>
                    <label data-label id="labelWithPreexistingId"></label>
                    <input data-input id="inputWithPreexistingId" />
                </div>
            </template>
        </form-sync>`,
    );
    document.body.appendChild(withId);


    await new Promise(resolve => window.requestAnimationFrame(resolve));

    // Existing for attribute is preserved
    t.is(document.querySelector('#labelWithFor').getAttribute('for'), 'notModified');

    // New attribute is set and identical to id of input
    const forAttribute = document.querySelector('#labelWithoutFor').getAttribute('for');
    t.not(forAttribute, null);
    t.is(forAttribute, document.querySelector('.inputForLabelWithoutFor').getAttribute('id'));

    // Use existing id
    t.is(
        document.querySelector('#labelWithPreexistingId').getAttribute('for'),
        'inputWithPreexistingId',
    );

    t.is(errors.length, 0);
});
