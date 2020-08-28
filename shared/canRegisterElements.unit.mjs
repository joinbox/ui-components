import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['canRegisterElements.testElement.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
}

test('sets model elements', async(t) => {
    const { document, errors, window } = await setup(true);
    const elementHTML = '<test-registrar></test-registrar>';
    const testElement = createElement(document, elementHTML);
    document.body.appendChild(testElement);
    const announcer = {
        setModel(model) {
            this.model = model;
        },
    };
    const event = new window.CustomEvent('announce-element', {
        detail: {
            element: announcer,
        },
        bubbles: true,
    });
    window.dispatchEvent(event);
    await new Promise(resolve => setTimeout(resolve));
    t.is(announcer.model, 'myModel');
    if (errors.length) console.log(errors);
    t.is(errors.length, 0);
});

test('checks name, type and identifier, target', async(t) => {
    const { document, errors, window } = await setup(true);
    const elementHTML = '<test-registrar data-event-name="register-my-element" data-event-type="myType" data-event-identifier="myId"></test-registrar>';
    const testElement = createElement(document, elementHTML);
    // Check if we can pass in the eventTarget
    window.eventTarget = testElement;
    document.body.appendChild(testElement);
    const announcer = {
        setModel(model) {
            this.model = model;
        },
    };
    const event = new window.CustomEvent('register-my-element', {
        detail: {
            element: announcer,
            eventIdentifier: 'myId',
            eventType: 'myType',
            eventName: 'register-my-element',
        },
        bubbles: true,
    });
    testElement.dispatchEvent(event);
    await new Promise(resolve => setTimeout(resolve));
    t.is(announcer.model, 'myModel');
    if (errors.length) console.log(errors);
    t.is(errors.length, 0);
});

