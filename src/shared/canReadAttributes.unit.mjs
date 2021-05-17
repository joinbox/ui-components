import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['canReadAttributes.testElement.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};

test('throws if config is invalid', async(t) => {
    const { window, document, errors } = await setup(true);
    window.createWatcher([{}]);
    document.createElement('test-watcher');
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('you passed [{}] instead'), true);
});

test('sets properties with defaults', async(t) => {
    const { window, document, errors } = await setup(true);
    window.createWatcher([{
        name: 'test',
    }]);
    const watcher = createElement(document, '<test-watcher test="no"></test-watcher>');
    t.is(watcher.test, 'no');
    t.is(errors.length, 0);
});

test('sets properties', async(t) => {
    const { window, document, errors } = await setup(true);
    window.createWatcher([{
        name: 'test',
        property: 'prop',
        transform: value => parseInt(value, 10),
        validate: () => true,
    }]);
    const watcher = createElement(document, '<test-watcher test="7"></test-watcher>');
    t.is(watcher.prop, 7);
    t.is(errors.length, 0);
});

test('validates properties', async(t) => {
    const { window, document, errors } = await setup(true);
    window.createWatcher([{
        name: 'test',
        validate: () => false,
    }]);
    createElement(document, '<test-watcher test="7"></test-watcher>');
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('Attribute test does not match'), true);
});

