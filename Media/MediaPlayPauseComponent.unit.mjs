import test from 'ava';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['MediaPlayPauseComponentElement.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};


test('starts playing', async(t) => {
    const { window, document, errors } = await setup();
    const model = {
        handlers: {},
        playing: false,
        load() {},
        play() {
            setTimeout(() => {
                this.loadingState = 'loaded';
                this.playing = true;
                this.handlers.play();
            });
        },
        pause() {
            this.playing = false;
            this.handlers.pause();
        },
        loadingState: undefined,
        on(name, cb) { this.handlers[name] = cb; },
    };
    const html = '<media-play-pause-component data-playing-class="play" data-paused-class="pause"></media-play-pause-component>';
    const play = createElement(document, html);
    play.setModel(model);
    await play.connectedCallback();
    // Trigger play event
    play.dispatchEvent(new window.Event('click'));
    await new Promise(resolve => setTimeout(resolve));
    t.is(play.classList.contains('play'), true);
    play.dispatchEvent(new window.Event('click'));
    await new Promise(resolve => setTimeout(resolve));
    t.is(play.classList.contains('play'), false);
    t.is(play.classList.contains('pause'), true);
    t.is(errors.length, 0);
});

