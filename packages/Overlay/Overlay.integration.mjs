import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({
        basePath,
        scripts: ['OverlayElement.js', 'OverlayButtonElement.js'],
        hideErrors,
    });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};

test('it opens and closes overlay', async(t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = cb => cb();
    const overlay = createElement(document, '<overlay-component data-visible-class-name="visible" data-name="test"></overlay-component>');
    const toggle = createElement(document, '<overlay-button-component data-overlay-name="test"></overlay-button-component>');
    document.body.appendChild(overlay);
    document.body.appendChild(toggle);
    t.is(overlay.model.isOpen, false);
    await new Promise(resolve => setTimeout(resolve));
    toggle.dispatchEvent(new window.MouseEvent('click'));
    t.is(overlay.model.isOpen, true);
    toggle.dispatchEvent(new window.MouseEvent('click'));
    t.is(overlay.model.isOpen, false);
    t.is(errors.length, 0);
});

/* test('watch', async(t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = cb => cb();
    const script = document.createElement('script');
    script.textContent = `
        class TC extends HTMLElement {
            test = true;
            static get observedAttributes() {
                return ['name'];
            }
            attributeChangedCallback(...args) {
                console.error(...args);
            }
        }
        window.customElements.define('test-comp', TC);
    `;
    document.body.appendChild(script);
    const tc = document.createElement('test-comp');
    document.body.appendChild(tc);
    t.is(tc.test, true);
    console.log(errors);
    tc.setAttribute('name', 'test');
    t.pass();
}); */
