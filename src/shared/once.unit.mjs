import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';
import once from './once.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: [], hideErrors });
};

test('throws if required attributes are missing', async(t) => {
    const { document, errors } = await setup(true);
    const element = document.createElement('div');
    let executed = 0;
    once(element, 'my-name', () => {
        executed++;
    });
    once(element, 'my-name', () => {
        executed++;
    });
    t.is(executed, 1);
    t.is(element.dataset.initializedMyName, 'true');
    t.is(errors.length, 0);
});
