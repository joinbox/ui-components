import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';
import createElement from '../../../src/testHelpers/createElement.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['VimeoPlayerElement.js'], hideErrors });
};

test('replaces content on click with correct iframe', async(t) => {
    const { document, errors, window } = await setup(true);
    const element = createElement({
        document,
        html: `<vimeo-player data-video-id="558118399">
                <div class="originalContent">
                </div>
            </vimeo-player>`,
    });
    document.body.appendChild(element);
    element.dispatchEvent(new window.MouseEvent('click'));
    t.is(element.querySelector('.originalContent'), null);
    const iframe = element.querySelector('iframe');
    t.not(iframe, null);
    const src = iframe.getAttribute('src');
    t.is(src, 'https://player.vimeo.com/video/558118399?autoplay=true&muted=true');
    t.is(errors.length, 0);
});

// We cannot test unmuted video or autoplay, as JSDOM does not seem to support the needed
// APIs. Use VimeoPlayer.html to test, it's not crucial for the component to work
// Leave code to fix it one day maybe
/* test.only('autoplays vimeo', async(t) => {
    const { document, errors, window } = await setup(true);
    const element = createElement({
        document,
        html: `<vimeo-player data-video-id="558118399">
            </vimeo-player>`,
    });
    document.body.appendChild(element);
    element.dispatchEvent(new window.MouseEvent('click'));
    await element.vimeoPlayerPromise;
    // element.player.getPaused().then(console.log);
    t.is(errors.length, 0);
}); */

test('restores original content on restore', async(t) => {
    const { document, errors, window } = await setup(true);
    const element = createElement({
        document,
        html: `<vimeo-player data-video-id="558118399">
                <div class="originalContent">
                </div>
            </vimeo-player>`,
    });
    document.body.appendChild(element);
    t.throws(() => element.restore(), {
        message: /after the video/,
    });
    element.dispatchEvent(new window.MouseEvent('click'));
    t.is(element.querySelector('.originalContent'), null);
    element.restore();
    t.not(element.querySelector('.originalContent'), null);
    t.is(errors.length, 0);
});
