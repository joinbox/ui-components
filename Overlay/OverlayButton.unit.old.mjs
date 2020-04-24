import { dirname, join } from 'path';
import test from 'ava';
import jsdom from 'jsdom';
// import OverlayButton from './OverlayButton.mjs';

const { JSDOM } = jsdom;


const usedGlobals = ['window'];
const originalGlobals = new Map();
usedGlobals.forEach(key => originalGlobals.set(key, global[key]));

const setupDOM = () => {

    const errors = [];
    const virtualConsole = new jsdom.VirtualConsole();
    virtualConsole.on('jsdomError', err => errors.push(err));

    const overlayButtonScript = join(dirname(import.meta.url), 'OverlayButton.mjs');
    const { window } = new JSDOM(`
        <body>
            <script src="${overlayButtonScript}" type="module"></script>
            <div class="container"></div>
        </body>
    `, {
        resources: 'usable',
        runScripts: 'dangerously',
        virtualConsole,
    });
    const { document } = window;
    global.window = window;
    return {
        window,
        document,
        errors,
    };
};

const setupButton = (attributes = '') => (
    `<jb-overlay-button ${attributes}>
        Open Overlay
    </jb-overlay-button>`
);

const teardownDOM = () => {
    usedGlobals.forEach((key) => { global[key] = originalGlobals[key]; });
};



test('test', async(t) => {
    setupDOM();
    const { default: OverlayButton } = await import('./OverlayButton.mjs');
    const a = new OverlayButton();
    teardownDOM();
});

/* test.only('throws on missing data-overlay-name attribute', async(t) => {
    const { window, errors, document } = setupDOM();
    const button = setupButton();
    document.querySelector('.container').innerHTML = button;
    // await window.customElements.whenDefined('jb-overlay-button');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log(errors);
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('data-overlay-name'), true);
    teardownDOM();
});

test('throws on missing data-button-type attribute', async(t) => {
    const { window, errors, document } = setupDOM();
    const button = setupButton('data-overlay-name=\'test\'');
    document.querySelector('.container').innerHTML = button;
    await window.customElements.whenDefined('jb-overlay-button');
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('data-button-type'), true);
    teardownDOM();
});

test('dispatches expected event on open/close buttons', async(t) => {
    const { window, document } = setupDOM();
    const openButton = setupButton('data-overlay-name=\'test\' data-button-type=\'open\'');
    const closeButton = setupButton('data-overlay-name=\'test\' data-button-type=\'close\'');
    document.querySelector('.container').innerHTML = `${closeButton} ${openButton}`;
    await window.customElements.whenDefined('jb-overlay-button');
    const events = [];
    window.addEventListener('openoverlay', ev => events.push(ev));
    window.addEventListener('closeoverlay', ev => events.push(ev));
    document.querySelector('jb-overlay-button[data-button-type=\'open\']')
        .dispatchEvent(new window.MouseEvent('click'));
    document.querySelector('jb-overlay-button[data-button-type=\'close\']')
        .dispatchEvent(new window.MouseEvent('click'));
    t.is(events.length, 2);
    t.deepEqual(events[0].detail, { overlayName: 'test' });
    t.deepEqual(events[1].detail, { overlayName: 'test' });
});


*/
