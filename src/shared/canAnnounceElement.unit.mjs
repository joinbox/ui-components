import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['canAnnounceElement.testElement.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
}

test('announces itself with correct arguments', async(t) => {
    const { document, errors, window } = await setup(true);
    let run = false;
    const elementHTML = '<test-announcer data-event-name="register-my-element" data-event-type="myType" data-event-identifier="myId"></test-announcer>';
    const testElement = createElement(document, elementHTML);
    window.addEventListener('register-my-element', (ev) => {
        t.is(ev.detail.eventType, 'myType');
        t.is(ev.detail.eventIdentifier, 'myId');
        t.is(ev.detail.element, testElement);
        // Make sure callback was called
        run = true;
    });
    document.body.appendChild(testElement);
    await new Promise(resolve => setTimeout(resolve));
    if (errors.length) console.log(errors);
    t.is(errors.length, 0);
    t.is(run, true);
});

test('uses expected defaults', async(t) => {
    const { document, errors, window } = await setup(true);
    const testElement = createElement(document, '<test-announcer></test-announcer>');
    let run = false;
    window.addEventListener('announce-element', (ev) => {
        t.is(ev.detail.element, testElement);
        // Make sure callback was fired
        run = true;
    });
    document.body.appendChild(testElement);
    await new Promise(resolve => setTimeout(resolve));
    t.is(run, true);
    if (errors.length) console.log(errors);
    t.is(errors.length, 0);
});

test('accepts model', async(t) => {
    const { document, errors } = await setup(true);
    const testElement = document.createElement('test-announcer');
    testElement.setModel('myModel');
    t.is(testElement.model, 'myModel');    
    t.is(errors.length, 0);
});

test('announce returns promise that resolves when announced', async(t) => {
    const { window, document } = await setup(true);
    const testElement = document.createElement('test-announcer');
    const promise = testElement.announce();
    t.is(promise instanceof window.Promise, true);
    promise.then(() => {
        t.is(testElement.model, 'myModel');    
    });
    testElement.setModel('myModel');
});

