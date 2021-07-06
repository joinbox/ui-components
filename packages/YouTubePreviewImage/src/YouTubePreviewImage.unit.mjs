import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';
import createElement from '../../../src/testHelpers/createElement.mjs';
// canvas NPM package is required in order to load images from external sources, see
// https://github.com/jsdom/jsdom#loading-subresources

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['YouTubePreviewImageElement.js'], hideErrors });
};

test('fails if img element is missing', async(t) => {
    const { document, errors } = await setup(true);
    const preview = createElement({
        document,
        html: `<youtube-preview-image data-video-id="m7MtIv9a0A4">
            </youtube-preview-image>`,
    });
    document.body.appendChild(preview);
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('img as child'), true);
});


test('displays fallback image if video cannot be found ', async(t) => {
    const { document, errors } = await setup(true);
    const src = 'https://picsum.photos/200/300';
    const preview = createElement({
        document,
        html: `<youtube-preview-image data-video-id="invalid!">
                <img src="${src}" />
            </youtube-preview-image>`,
    });
    document.body.appendChild(preview);
    await document.body.querySelector('youtube-preview-image').promise;
    // There will be errors (from image that could not be loaded). Make sure that errors only
    // contains these expected errors
    t.is(errors.every(({ message }) => message.includes('Could not load img:')), true);
    t.is(preview.querySelector('img').getAttribute('src'), src);
});


test('displays best matching image ', async(t) => {
    const { document, errors } = await setup(true);
    const preview = createElement({
        document,
        html: `<youtube-preview-image data-video-id="m7MtIv9a0A4">
                <img src="https://picsum.photos/200/300" />
            </youtube-preview-image>`,
    });
    document.body.appendChild(preview);
    await document.body.querySelector('youtube-preview-image').promise;
    t.is(errors.length, 0);
    const src = preview.querySelector('img').getAttribute('src');
    t.is(/https:\/\/img\.youtube\.com\/.*\/maxresdefault.jpg/.test(src), true);
});


test('tests for 120px width of images ', async(t) => {
    const { document, errors } = await setup(true);
    const preview = createElement({
        document,
        // Video without a high res preview image
        html: `<youtube-preview-image data-video-id="Fo5fMMojk38">
                <img src="https://picsum.photos/200/300" />
            </youtube-preview-image>`,
    });
    document.body.appendChild(preview);
    await document.body.querySelector('youtube-preview-image').promise;
    const src = preview.querySelector('img').getAttribute('src');
    // There will be errors (from image that could not be loaded). Make sure that errors only
    // contains these expected errors (120px wide images also throw because they get a 404)
    t.is(errors.every(({ message }) => message.includes('Could not load img:')), true);
    t.is(/https:\/\/img\.youtube\.com\/.*\/hqdefault.jpg/.test(src), true);
});


