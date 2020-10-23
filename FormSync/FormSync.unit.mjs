import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

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
        </form>`,
    );
    document.body.appendChild(original);
    const clone = createElement(
        document,
        `<form-sync data-form-elements-selector="#originalText" data-auto-submit="true">
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
    document.querySelector('form').submit = () => { submitted += 1; };

    // Change is synced
    const input = document.querySelector('#cloneText');
    input.value = 'newValue';
    input.dispatchEvent(new window.Event('change', { bubbles: true }));
    t.is(submitted, 1);

    t.is(errors.length, 0);
});
