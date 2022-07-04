import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';
import createElement from '../../../src/testHelpers/createElement.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['VimeoPreviewImageElement.js'], hideErrors });
};

const polyfillFetch = (document) => {
    // JSDOM does not support fetch; inject it
    const base = dirname(fileURLToPath(new URL(import.meta.url)));
    const fetchPath = '../node_modules/whatwg-fetch/dist/fetch.umd.js';
    const fetchContent = readFileSync(join(base, fetchPath), 'utf8');
    const fetchScript = document.createElement('script');
    fetchScript.textContent = fetchContent;
    document.body.appendChild(fetchScript);
};

test('fails if img element is missing', async(t) => {
    const { document, errors } = await setup(true);
    const preview = createElement({
        document,
        html: `<vimeo-preview-image data-video-id="558118399">
        </vimeo-preview-image>`,
    });
    document.body.appendChild(preview);
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('img as child'), true);
});

test('displays thumbnail', async(t) => {
    const { document, errors } = await setup(true);
    polyfillFetch(document);
    const preview = createElement({
        document,
        html: `<vimeo-preview-image data-video-id="558118399">
                <img src="test.jpg">
            </vimeo-preview-image>`,
    });
    document.body.appendChild(preview);
    const image = document.querySelector('img');
    await preview.connectedCallback();
    t.is(image.getAttribute('src').includes('vimeocdn.com'), true);
    t.is(errors.length, 0);
});

test('fails with invalid video id', async(t) => {
    const { document, errors } = await setup(true);
    polyfillFetch(document);
    const preview = createElement({
        document,
        html: `<vimeo-preview-image data-video-id="abcd">
                <img src="test.jpg">
            </vimeo-preview-image>`,
    });
    t.throwsAsync(async() => preview.connectedCallback(), {
        message: /404, should be/,
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    t.is(errors.length, 0);
});

test('passes width to get matching preview image', async(t) => {
    const { document, errors } = await setup(true);
    polyfillFetch(document);
    const videoID = 558118399;
    const preview = createElement({
        document,
        html: `<vimeo-preview-image data-video-id="${videoID}" data-video-width="1000">
                <img src="test.jpg">
            </vimeo-preview-image>`,
    });
    document.body.appendChild(preview);
    const image = document.querySelector('img');
    await preview.connectedCallback();
    // Next smaller image is used, for 1000px that would be 960px. See docs
    // https://developer.vimeo.com/api/oembed/videos
    t.is(image.getAttribute('src').endsWith('_960'), true);
    t.is(errors.length, 0);
});
