import { dirname } from 'path';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

test('throws if arguments are missing', async(t) => {
    const basePath = dirname(import.meta.url);
    const { errors, document, window } = await getDOM({ basePath, scripts: ['OverlayButton.js'] });
    const buttonWithoutOverlayName = document.createElement('jb-overlay-button');
    document.body.appendChild(buttonWithoutOverlayName);
    buttonWithoutOverlayName.dispatchEvent(new window.MouseEvent('click'));
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('Attribute data-overlay-name'), true);
});


test('throws if argumentsssss are missing', async(t) => {
    const basePath = dirname(import.meta.url);
    const { errors, document, window } = await getDOM({ basePath, scripts: ['OverlayButton.js'] });
    const buttonWithoutButtonType = document.createElement('jb-overlay-button');
    buttonWithoutButtonType.setAttribute('data-overlay-name', 'overlay1');
    buttonWithoutButtonType.dispatchEvent(new window.MouseEvent('click'));
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('Attribute data-button-type'), true);
});


