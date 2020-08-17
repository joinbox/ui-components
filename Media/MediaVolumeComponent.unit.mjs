import test from 'ava';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['components.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};


test('throws if input is missing', async(t) => {
    const { document, errors } = await setup(true);
    createElement(document, '<media-volume-component></media-volume-component>');
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('child that matches'), true);
});


test('updates input when volume changes', async(t) => {
    const { document, errors } = await setup();
    const volume = createElement(
        document,
        '<media-volume-component><input type="range"/></media-volume-component>',
    );
    const model = {
        volume: 0.9,
        handlers: {},
        on(type, handler) { this.handlers[type] = handler; },
        getVolume() { return this.volume },
    };
    volume.setModel(model);
    await volume.connectedCallback();
    // Call canplaythrough handler; should set total time
    model.handlers.canplaythrough();
    t.is(volume.querySelector('input').value, '90');
    // Call volumechange handler
    model.handlers.volumechange(0.8);
    t.is(volume.querySelector('input').value, '80');
    t.is(errors.length, 0);
});


test('updates model on input change', async(t) => {
    const { window, document, errors } = await setup();
    const volume = createElement(
        document,
        '<media-volume-component><input type="range"/></media-volume-component>',
    );
    const event = new window.Event('input');
    const model = {
        volume: 0,
        updateVolume(volume) {
            this.volume = volume;
        },
        loadingState: true,
    };
    volume.setModel(model);
    const input = volume.querySelector('input');
    input.value = 70;
    input.dispatchEvent(event);
    t.is(errors.length, 0);
    t.is(model.volume, 0.7);
});
