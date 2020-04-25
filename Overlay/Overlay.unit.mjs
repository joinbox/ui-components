import { dirname } from 'path';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(import.meta.url);
    return getDOM({ basePath, scripts: ['Overlay.js'], hideErrors });
};

const awaitRAF = window => new Promise(resolve => window.requestAnimationFrame(resolve));

test('throws if data-overlay-name is missing when an event is fired', async(t) => {
    const { document, errors, window } = await setup(true);
    const overlay = document.createElement('jb-overlay');
    document.body.appendChild(overlay);
    const options = { detail: { overlayName: 'overlay1' } };
    window.dispatchEvent(new window.CustomEvent('openoverlay', options));
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('Attribute data-overlay-name'), true);
});

test('exposes open, close and isOpen method, updates DOM', async(t) => {
    const { document, window } = await setup();
    const overlay = document.createElement('jb-overlay');
    overlay.setAttribute('data-overlay-name', 'overlay1');
    overlay.setAttribute('data-visible-class-name', 'is-visible');
    document.body.appendChild(overlay);

    overlay.open();
    await awaitRAF(window);
    t.is(overlay.classList.contains('is-visible'), true);
    t.is(overlay.isOpen, true);

    overlay.close();
    await awaitRAF(window);
    t.is(overlay.classList.contains('is-visible'), false);
    t.is(overlay.isOpen, false);

});


test('opens if overlay is opened', async(t) => {

    const { document, errors, window } = await setup();
    const overlay = document.createElement('jb-overlay');
    overlay.setAttribute('data-overlay-name', 'overlay1');
    overlay.setAttribute('data-visible-class-name', 'is-visible');
    document.body.appendChild(overlay);

    const wrongOptions = { details: { overlayName: 'other' } };
    window.dispatchEvent(new window.CustomEvent('openoverlay', wrongOptions));
    t.is(overlay.isOpen, false);

    const options = { detail: { overlayName: 'overlay1' } };
    window.dispatchEvent(new window.CustomEvent('openoverlay', options));
    t.is(overlay.isOpen, true);

    t.is(errors.length, 0);

});


test('closes if overlay is closed', async(t) => {

    const { document, errors, window } = await setup();
    const overlay = document.createElement('jb-overlay');
    overlay.setAttribute('data-overlay-name', 'overlay1');
    overlay.setAttribute('data-visible-class-name', 'is-visible');
    document.body.appendChild(overlay);
    overlay.open();

    const wrongOptions = { detail: { overlayName: 'other' } };
    window.dispatchEvent(new window.CustomEvent('closeoverlay', wrongOptions));
    t.is(overlay.isOpen, true);

    const options = { detail: { overlayName: 'overlay1' } };
    window.dispatchEvent(new window.CustomEvent('closeoverlay', options));
    t.is(overlay.isOpen, false);

    t.is(errors.length, 0);

});


test('closes on esc if is open', async(t) => {

    const { document, errors, window } = await setup();
    const overlay = document.createElement('jb-overlay');
    overlay.setAttribute('data-overlay-name', 'overlay1');
    overlay.setAttribute('data-visible-class-name', 'is-visible');
    document.body.appendChild(overlay);
    overlay.open();
    // Close listeners are added with a minial delay; await it
    await new Promise(resolve => setTimeout(resolve));

    // ESC is disabled: don't close
    overlay.setAttribute('data-disable-esc', '');
    window.dispatchEvent(new window.KeyboardEvent('keydown', { keyCode: 27 }));
    t.is(overlay.isOpen, true);


    // ESC is not disabled: close
    overlay.removeAttribute('data-disable-esc');
    window.dispatchEvent(new window.KeyboardEvent('keydown', { keyCode: 27 }));
    t.is(overlay.isOpen, false);

    t.is(errors.length, 0);

});


test('closes on click outside', async(t) => {

    const { document, errors, window } = await setup();
    const overlay = document.createElement('jb-overlay');
    overlay.setAttribute('data-overlay-name', 'overlay1');
    overlay.setAttribute('data-visible-class-name', 'is-visible');
    document.body.appendChild(overlay);
    overlay.open();
    // Close listeners are added with a minial delay; await it
    await new Promise(resolve => setTimeout(resolve));

    const outside = document.createElement('div');
    document.body.appendChild(outside);

    // Click outside is disabled: don't close
    overlay.setAttribute('data-disable-click-outside', '');
    outside.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    t.is(overlay.isOpen, true);

    overlay.removeAttribute('data-disable-click-outside', '');

    // Dont close if click is inside
    const inside = document.createElement('div');
    overlay.appendChild(inside);
    inside.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    t.is(overlay.isOpen, true);

    // Click outside is enabled: close
    outside.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    t.is(overlay.isOpen, false);

    t.is(errors.length, 0);

});


test('removes listeners when it is disconnected from DOM', async(t) => {

    const { document, errors, window } = await setup();
    const overlay = document.createElement('jb-overlay');
    overlay.setAttribute('data-overlay-name', 'o');
    overlay.setAttribute('data-visible-class-name', 'is-visible');
    // Append overlay to DOM first …
    document.body.appendChild(overlay);
    // … then remove from DOM
    document.body.removeChild(overlay);

    // Dispatch openoverlay on non-attached overlay
    window.dispatchEvent(new window.CustomEvent('openoverlay', { detail: { overlayName: 'o' } }));
    await awaitRAF(window);
    t.is(overlay.classList.contains('is-visible'), false);

    // Dispatch closeoverlay on non-attached overlay
    overlay.classList.add('is-visible');
    window.dispatchEvent(new window.CustomEvent('closeoverlay', { detail: { overlayName: 'o' } }));
    await awaitRAF(window);
    t.is(overlay.classList.contains('is-visible'), true);

    t.is(errors.length, 0);

});

test('esc and outside click are only added on open', async(t) => {

    const { document, errors, window } = await setup();
    const overlay = document.createElement('jb-overlay');
    overlay.setAttribute('data-overlay-name', 'o');
    overlay.setAttribute('data-visible-class-name', 'is-visible');
    document.body.appendChild(overlay);
    const outside = document.createElement('div');
    document.body.appendChild(outside);

    // Open and close to see if listeners are correctly removed
    overlay.open();
    // Wait until classes were set on DOM
    await awaitRAF(window);
    overlay.close();
    // Only re-add .isVisible after RAF (which removed exactly that class)
    await awaitRAF(window);
    overlay.classList.add('is-visible');

    // Dispatch esc on closed overlay
    window.dispatchEvent(new window.KeyboardEvent('keydown', { keyCode: 27 }));
    await awaitRAF(window);
    // is-visible class was not removed means that close was not called
    t.is(overlay.classList.contains('is-visible'), true);

    // Dispatch outside click on non-attached overlay
    outside.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await awaitRAF(window);
    // is-visible class was not removed means that close was not called
    t.is(overlay.classList.contains('is-visible'), true);

    t.is(errors.length, 0);
});


test('displays background if set', async(t) => {
    const { document, errors, window } = await setup();
    const overlay = document.createElement('jb-overlay');
    overlay.setAttribute('data-overlay-name', 'o');
    overlay.setAttribute('data-visible-class-name', 'is-visible');
    overlay.setAttribute('data-background-selector', '.background');
    overlay.setAttribute('data-background-visible-class-name', 'bg-visible');
    document.body.appendChild(overlay);
    const background = document.createElement('div');
    background.classList.add('background');
    document.body.appendChild(background);

    overlay.open();
    await awaitRAF(window);
    t.is(background.classList.contains('bg-visible'), true);

    overlay.close();
    await awaitRAF(window);
    t.is(background.classList.contains('bg-visible'), false);
    t.is(errors.length, 0);

});

