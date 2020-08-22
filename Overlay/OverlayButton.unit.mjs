import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['OverlayButtonElement.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};

test('throws if required attributes are missing', async(t) => {
    const { document, errors } = await setup(true);
    document.createElement('overlay-button-component');
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('Attribute data-overlay-name'), true);
});

test('updates model', async(t) => {
    const { window, document, errors } = await setup(true);
    const createModel = () => ({
        isOpen: false,
        toggle() { this.isOpen = !this.isOpen },
        open() { this.isOpen = true; },
        close() { this.isOpen = false; },
    });

    // Defaults to toggle button
    const toggleButton = createElement(
        document,
        '<overlay-button-component data-overlay-name="test"></overlay-button-component>',
    );
    const toggleModel = createModel();
    toggleButton.setModel(toggleModel);
    toggleButton.dispatchEvent(new window.Event('click'));
    await new Promise(resolve => setTimeout(resolve));
    t.is(toggleModel.isOpen, true);
    toggleButton.dispatchEvent(new window.Event('click'));
    await new Promise(resolve => setTimeout(resolve));
    t.is(toggleModel.isOpen, false);

    // Open
    const openButton = createElement(
        document,
        '<overlay-button-component data-overlay-name="test" data-type="open"></overlay-button-component>',
    );
    const openModel = createModel();
    openButton.setModel(openModel);
    openButton.dispatchEvent(new window.Event('click'));
    // Check if it's not a toggle button (would re-close overlay)
    openButton.dispatchEvent(new window.Event('click'));
    t.is(openModel.isOpen, true);

    // Close
    const closeButton = createElement(
        document,
        '<overlay-button-component data-overlay-name="test" data-type="close"></overlay-button-component>',
    );
    const closeModel = createModel();
    closeModel.isOpen = true;
    closeButton.setModel(closeModel);
    closeButton.dispatchEvent(new window.Event('click'));
    // Check if it's not a toggle button (would re-open overlay)
    closeButton.dispatchEvent(new window.Event('click'));
    await new Promise(resolve => setTimeout(resolve));
    t.is(closeModel.isOpen, false);

    t.is(errors.length, 0);
});


test('updates DOM', async(t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = cb => cb();

    // Defaults to toggle button
    const button = createElement(
        document,
        '<overlay-button-component data-overlay-name="test" data-open-class-name="is-open" data-closed-class-name="is-closed"></overlay-button-component>',
    );
    const model = {
        isOpen: false,
        handlers: {},
        on(type, handler) { this.handlers[type] = handler; },
    };
    button.setModel(model);
    await button.connectedCallback();

    t.is(button.classList.contains('is-closed'), true);

    model.isOpen = true;
    model.handlers.change();

    t.is(button.classList.contains('is-open'), true);
    t.is(button.classList.contains('is-closed'), false);

    t.is(errors.length, 0);
});
