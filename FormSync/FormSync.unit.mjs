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
    const { document, errors } = await setup(true);
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
                <label data-label></label>
                <input type="radio" data-input />
            </template>
        </form-sync>`,
    );
    document.body.appendChild(clone);
    console.log(document.body.innerHTML);

    t.is(errors.length, 0);
});
