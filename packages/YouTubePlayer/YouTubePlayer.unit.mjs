import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../src/testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['YouTubePlayerElement.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};

test('loads API on mouseenter', async(t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = cb => cb();
    const player = createElement(document, '<youtube-player-component data-video-id="m7MtIv9a0A4" data-loading-class-name="loading"></youtube-player-compoent>');
    document.body.appendChild(player);
    player.dispatchEvent(new window.MouseEvent('mouseenter'));
    t.is(player.player instanceof window.Promise, true);
    t.is(errors.length, 0);
});


test('adds loading class on click', async(t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = cb => cb();
    const player = createElement(document, '<youtube-player-component data-video-id="m7MtIv9a0A4" data-loading-class-name="loading"></youtube-player-compoent>');
    document.body.appendChild(player);
    player.dispatchEvent(new window.MouseEvent('click'));
    t.is(player.classList.contains('loading'), true);
    t.is(errors.length, 0);
});

test('replaces player when ready', async(t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = cb => cb();
    const player = createElement(document, '<youtube-player-component data-video-id="m7MtIv9a0A4" data-loading-class-name="loading"></youtube-player-compoent>');
    document.body.appendChild(player);
    player.dispatchEvent(new window.MouseEvent('click'));
    await player.player;
    // loading class is removed
    t.is(player.classList.contains('loading'), false);
    t.is(player.querySelectorAll('iframe').length, 1);
    t.is(errors.length, 0);
});

test('uses player variables', async(t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = cb => cb();
    const player = createElement(document, '<youtube-player-component data-video-id="m7MtIv9a0A4" data-player-variables=\'{"controls": 0}\' data-loading-class-name="loading"></youtube-player-compoent>');
    document.body.appendChild(player);
    player.dispatchEvent(new window.MouseEvent('click'));
    await player.player;
    // loading class is removed
    t.is(player.innerHTML.includes('controls=0'), true);
    t.is(errors.length, 0);
});

