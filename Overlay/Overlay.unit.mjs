import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['OverlayElement.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};

test('throws if required attributes are missing', async(t) => {
    const { document, errors } = await setup(true);
    document.createElement('overlay-component');
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('Attribute data-name'), true);
});

test('shows up and hides', async(t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = cb => cb();
    const overlay = createElement(document, '<overlay-component data-visible-class-name="visible" data-name="test"></overlay-component>');
    t.is(overlay.classList.contains('visible'), false);
    overlay.model.open();
    t.is(overlay.classList.contains('visible'), true);
    overlay.model.close();
    t.is(overlay.classList.contains('visible'), false);
    t.is(errors.length, 0);
});


test('shows and hides background', async(t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = cb => cb();
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


test('closes on esc', async(t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = cb => cb();
    const overlay = createElement(document, '<overlay-component data-visible-class-name="visible" data-name="test"></overlay-component>');
    document.body.appendChild(overlay);
    overlay.model.open();
    await new Promise(resolve => setTimeout(resolve));
    window.dispatchEvent(new window.KeyboardEvent('keydown', { keyCode: 27 }));
    t.is(overlay.classList.contains('visible'), false);
    t.is(errors.length, 0);
});

test('disables scroll on body', async(t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = cb => cb();
    const overlay = createElement(document, '<overlay-component data-visible-class-name="visible" data-name="test"></overlay-component>');
    document.body.appendChild(overlay);
    overlay.model.open();
    await new Promise(resolve => setTimeout(resolve));
    t.is(window.getComputedStyle(document.body).overflow, 'hidden');
    overlay.model.close();
    await new Promise(resolve => setTimeout(resolve));
    t.is(window.getComputedStyle(document.body).overflow, '');
    t.is(errors.length, 0);
});


test('closes on click outside', async(t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = cb => cb();
    const overlay = createElement(document, '<overlay-component data-visible-class-name="visible" data-name="test"></overlay-component>');
    document.body.appendChild(overlay);
    overlay.model.open();
    await new Promise(resolve => setTimeout(resolve));
    // Does not close when clicked inside
    overlay.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    t.is(overlay.model.isOpen, true);
    // Closes on click outside
    document.body.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    t.is(overlay.model.isOpen, false);
    t.is(errors.length, 0);
});

