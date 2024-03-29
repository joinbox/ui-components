import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async (hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['OverlayElement.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};

test('throws if required attributes are missing', async (t) => {
    const { document, errors } = await setup(true);
    document.createElement('overlay-component');
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('Attribute data-name'), true);
});

test('shows up and hides', async (t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = (cb) => cb();
    const overlay = createElement(document, '<overlay-component data-visible-class-name="visible" data-name="test"></overlay-component>');
    t.is(overlay.classList.contains('visible'), false);
    overlay.model.open();
    t.is(overlay.classList.contains('visible'), true);
    overlay.model.close();
    t.is(overlay.classList.contains('visible'), false);
    t.is(errors.length, 0);
});


test('shows and hides background', async (t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = (cb) => cb();
    const overlay = createElement(document, '<overlay-component data-visible-class-name="visible" data-name="test" data-background-selector="#background" data-background-visible-class-name="visible"></overlay-component>');
    const background = createElement(document, '<div id="background"></div>');
    document.body.appendChild(background);
    document.body.appendChild(overlay);
    overlay.model.open();
    t.is(background.classList.contains('visible'), true);
    overlay.model.close();
    t.is(background.classList.contains('visible'), false);
    t.is(errors.length, 0);
});


test('closes on esc', async (t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = (cb) => cb();
    const overlay = createElement(document, '<overlay-component data-visible-class-name="visible" data-name="test"></overlay-component>');
    document.body.appendChild(overlay);
    overlay.model.open();
    await new Promise((resolve) => setTimeout(resolve));
    window.dispatchEvent(new window.KeyboardEvent('keydown', { keyCode: 27 }));
    t.is(overlay.classList.contains('visible'), false);
    t.is(errors.length, 0);
});

test('dispatch opened and closed events', async (t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = (cb) => cb();
    const events = [];
    // Listen to overlayOpened and overlayClosed on window so that we can also test if the events
    // are *not* fired when the overlay is created.
    window.addEventListener('overlayOpened', (ev) => { events.push(ev); });
    window.addEventListener('overlayClosed', (ev) => { events.push(ev); });
    const elements = createElement(
        document,
        '<div class="bubbler"><overlay-component data-visible-class-name="visible" data-name="test"></overlay-component><div class="bubbler">',
    );
    document.body.appendChild(elements);
    const overlay = document.querySelector('overlay-component');
    // Current events; check if they bubble
    overlay.model.open();
    overlay.model.close();
    overlay.model.open();
    t.is(events.length, 3);
    t.deepEqual(events.map((ev) => ev.type), ['overlayOpened', 'overlayClosed', 'overlayOpened']);
    // Detail contains a name property with the overlay's name
    t.deepEqual(events.map((ev) => ev.detail.name), Array.from({ length: 3 }).fill('test'));

    t.is(errors.length, 0);
});


test('closes on click outside', async (t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = (cb) => cb();
    const overlay = createElement(document, '<overlay-component data-visible-class-name="visible" data-name="test"></overlay-component>');
    document.body.appendChild(overlay);
    overlay.model.open();
    await new Promise((resolve) => setTimeout(resolve));
    // Does not close when clicked inside
    overlay.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    t.is(overlay.model.isOpen, true);
    // Closes on click outside
    document.body.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    t.is(overlay.model.isOpen, false);
    t.is(errors.length, 0);
});


test('opens and closes on corresponding events', async (t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = (cb) => cb();
    const overlay = createElement(document, '<overlay-component data-visible-class-name="visible" data-name="test"></overlay-component>');
    document.body.appendChild(overlay);
    // Wrong name
    window.dispatchEvent(new window.CustomEvent('openOverlay', { detail: { name: 'wrong' } }));
    t.is(overlay.model.isOpen, false);
    window.dispatchEvent(new window.CustomEvent('openOverlay', { detail: { name: 'test' } }));
    t.is(overlay.model.isOpen, true);
    // Wrong name
    window.dispatchEvent(new window.CustomEvent('closeOverlay', { detail: { name: 'wrong' } }));
    t.is(overlay.model.isOpen, true);
    window.dispatchEvent(new window.CustomEvent('closeOverlay', { detail: { name: 'test' } }));
    // await new Promise(resolve => setTimeout(resolve));
    t.is(overlay.model.isOpen, false);
    t.is(errors.length, 0);
});
