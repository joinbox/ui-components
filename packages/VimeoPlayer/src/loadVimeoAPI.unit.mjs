import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['loadVimeoAPI.window.js'], hideErrors });
};


test('returns if already loaded', async(t) => {
    const { errors, window } = await setup(true);
    window.Vimeo = {};
    window.Vimeo.Player = 'vimeoPlayer';
    window.vimeoPromise = window.loadVimeoAPI();
    const result = await window.vimeoPromise;
    t.is(result, 'vimeoPlayer');
    t.is(errors.length, 0);
});

test('returns if script is not there', async(t) => {
    const { errors, window } = await setup(true);
    window.vimeoPromise = window.loadVimeoAPI();
    t.is(window.vimeoPromise instanceof window.Promise, true);
    const result = await window.vimeoPromise;
    t.is(typeof result, 'function');
    t.is(result.name, 'Player');
    t.is(errors.length, 0);
});

test('returns if script is there but not loaded', async(t) => {
    const { document, errors, window } = await setup(true);
    const externalScript = document.createElement('script');
    externalScript.setAttribute('src', 'https://player.vimeo.com/api/player.js');
    document.body.appendChild(externalScript);
    window.vimeoPromise = window.loadVimeoAPI();
    const result = await window.vimeoPromise;
    t.is(typeof result, 'function');
    t.is(result.name, 'Player');
    t.is(errors.length, 0);
});

