import test from 'ava';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

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
        playing: false,
        load() {
            this.loadingState = 'loaded';
        },
        play() {
            this.playing = true;
        },
        pause() {
            this.playing = false;
        },
        loadingState: undefined,
    };
    const html = '<media-play-pause-component data-playing-class="play" data-paused-class="pause"></media-play-pause-component>';
    const play = createElement(document, html);
    play.setModel(model);
    // Fake addition to document
    await play.connectedCallback();
    // Trigger play event
    play.dispatchEvent(new window.Event('click'));
    t.is(model.playing, true);
    t.is(model.loadingState, 'loaded');
    // Trigger pause event
    play.dispatchEvent(new window.Event('click'));
    t.is(model.playing, false);
    t.is(errors.length, 0);
});

