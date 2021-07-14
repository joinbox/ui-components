import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['loadYouTubeAPI.window.js'], hideErrors });
};

test('loads and returns player', async(t) => {
    const { window, errors } = await setup();
    const Player = await window.loadYouTubeAPI();
    t.is(typeof Player, 'function');
    t.is(errors.length, 0);
});

test('only loads player once', async(t) => {
    const { document, window, errors } = await setup();
    await window.loadYouTubeAPI();
    // We don't know how many script tags YouTubeAPI will write; just count them here and check
    // if they stay the same
    const scriptCount = document.querySelectorAll('script').length;
    window.loadYouTubeAPI();
    await window.loadYouTubeAPI();
    t.is(document.querySelectorAll('script').length, scriptCount);
    t.is(errors.length, 0);
});

test('returns correct instance while loading', async(t) => {
    const { window, errors } = await setup();
    window.loadYouTubeAPI();
    const Player = await window.loadYouTubeAPI();
    t.is(typeof Player, 'function');
    t.is(errors.length, 0);
});

test('returns correct instance after loading', async(t) => {
    const { window, errors } = await setup();
    await window.loadYouTubeAPI();
    const Player = await window.loadYouTubeAPI();
    t.is(typeof Player, 'function');
    t.is(errors.length, 0);
});
