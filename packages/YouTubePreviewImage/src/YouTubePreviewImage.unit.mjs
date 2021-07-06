import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';
import createElement from '../../../src/testHelpers/createElement.mjs';

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
    // Component fetches images first – wait until it's (probably) done
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('ers', errors);
    t.is(errors.length, 0);
});


