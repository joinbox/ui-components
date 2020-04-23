import test from 'ava';
import jsdom from 'jsdom';
import YouTubePlayer from './YouTubePlayer.js';

const { JSDOM } = jsdom;


const usedGlobals = ['window', 'document', 'HTMLElement', 'requestAnimationFrame'];
const originalGlobals = new Map();
usedGlobals.forEach(key => originalGlobals.set(key, global[key]));

const setupDOM = (attributes) => {
    // There must be a script tag before which we will insert the YouTube API
    const { window } = new JSDOM(`
        <body>
            <div id="player1" data-video-id="m7MtIv9a0A4" data-loading-class="loading" ${attributes}>
                Preview here
            </div>
            <script>document.querySelector('#player1').innerHTML='test';</script>
        </body>
    `, {
        runScripts: 'dangerously',
        resources: 'usable',
    });
    const { document } = window;
    global.window = window;
    global.document = document;
    global.HTMLElement = window.HTMLElement;
    global.requestAnimationFrame = callback => callback();
    return { window, document };
};

const teardownDOM = () => {
    usedGlobals.forEach((key) => { global[key] = originalGlobals[key]; });
};

const waitForIframe = document => (
    new Promise((resolve, reject) => {
        let iterations = 0;
        const interval = setInterval(() => {
            iterations++;
            const iframe = document.querySelector('iframe');
            // if iframe is ready, YouTube script was executed successfully
            if (iframe) {
                clearInterval(interval);
                resolve(iframe);
            }
            // Handle timeout (after 3s)
            if (iterations > 60) reject(new Error('Test timed out'));
        }, 50);
    })
);


// Tests use the same globals; execute them serially
test.serial('throws with invalid argument', (t) => {
    const { document } = setupDOM();
    // Instances must match – we cannot use HTMLElement from a different JSDOM instance
    const youTubePlayer = new YouTubePlayer();
    t.throws(
        () => youTubePlayer.init(document.querySelector('invalid')),
        { message: /must be a HTMLElement, is null instead/ },
    );
    teardownDOM();
});


test.serial('loads YouTube script once', async(t) => {
    const { document, window } = setupDOM();
    const element = document.querySelector('#player1');
    const youTubePlayer = new YouTubePlayer();
    youTubePlayer.init(element);
    element.dispatchEvent(new window.MouseEvent('mouseenter'));
    // Test if YouTube script was added
    t.is(document.querySelectorAll('script').length, 2);
    element.dispatchEvent(new window.MouseEvent('mouseenter'));
    // YouTube script is only added once
    t.is(document.querySelectorAll('script').length, 2);
    // We cannot teardown the DOM before everything is done as YouTube will try to replace #player1
    // as soon as it's ready
    element.dispatchEvent(new window.MouseEvent('click'));
    await waitForIframe(document);
    teardownDOM();
});


test.serial('adds loading class', async(t) => {
    const { document, window } = setupDOM();
    const element = document.querySelector('#player1');
    const youTubePlayer = new YouTubePlayer();
    youTubePlayer.init(element);
    element.dispatchEvent(new window.MouseEvent('click'));
    t.is(element.classList.contains('loading'), true);
    await waitForIframe(document);
    teardownDOM();
});


test.serial('replaces video', async(t) => {
    const { document, window } = setupDOM();
    const element = document.querySelector('#player1');
    const youTubePlayer = new YouTubePlayer();
    youTubePlayer.init(element);
    element.dispatchEvent(new window.MouseEvent('click'));
    await waitForIframe(document);
    t.pass();
    teardownDOM();
});


test.serial('fails gracefully with invalid parameters', async(t) => {
    const { document, window } = setupDOM('data-video-parameters="{ invalidJSON }"');
    const element = document.querySelector('#player1');
    const youTubePlayer = new YouTubePlayer();
    youTubePlayer.init(element);
    element.dispatchEvent(new window.MouseEvent('click'));
    await waitForIframe(document);
    t.pass();
    teardownDOM();
});


test.serial('passes parameters to iframe', async(t) => {
    const { document, window } = setupDOM('data-video-parameters=\'{ "controls": 0  }\'');
    const element = document.querySelector('#player1');
    const youTubePlayer = new YouTubePlayer();
    youTubePlayer.init(element);
    element.dispatchEvent(new window.MouseEvent('click'));
    const iframe = await waitForIframe(document);
    const source = iframe.getAttribute('src');
    t.is(source.includes('controls=0'), true);
    teardownDOM();
});




