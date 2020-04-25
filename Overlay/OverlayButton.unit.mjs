import { dirname } from 'path';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async() => {
    const basePath = dirname(import.meta.url);
    return getDOM({ basePath, scripts: ['OverlayButton.js'] });
};

test('throws if attribute data-overlay-name or data-button-type are missing', async(t) => {
    const { window, document, errors } = await setup();

    const button = document.createElement('jb-overlay-button');
    document.body.appendChild(button);
    button.dispatchEvent(new window.MouseEvent('click'));
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('Attribute data-overlay-name'), true);

    button.setAttribute('data-overlay-name', 'overlay1');
    button.dispatchEvent(new window.MouseEvent('click'));
    t.is(errors.length, 2);
    t.is(errors[1].message.includes('Attribute data-button-type'), true);

});


test('dispatches correct events on click', async(t) => {

    const { window, document, errors } = await setup();

    const button = document.createElement('jb-overlay-button');
    button.setAttribute('data-overlay-name', 'overlay1');
    button.setAttribute('data-button-type', 'open');
    document.body.appendChild(button);

    const events = [];
    window.addEventListener('openoverlay', ev => events.push(ev));
    window.addEventListener('closeoverlay', ev => events.push(ev));

    button.dispatchEvent(new window.MouseEvent('click'));
    t.is(events.length, 1);
    t.is(events[0].type, 'openoverlay');
    t.deepEqual(events[0].detail, { overlayName: 'overlay1' });

    button.setAttribute('data-button-type', 'close');
    button.dispatchEvent(new window.MouseEvent('click'));
    t.is(events.length, 2);
    t.is(events[1].type, 'closeoverlay');
    t.deepEqual(events[1].detail, { overlayName: 'overlay1' });

    t.is(errors.length, 0);

});
