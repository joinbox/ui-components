import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';
import canBeIdentical from './canBeIdentical.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['handleLinkClicks.window.js'], hideErrors });
};

test('returns true if attributes are identical', async(t) => {
    const { document } = await setup(true);
    const script = document.createElement('script');
    t.is(canBeIdentical(script), false);
    const link = document.createElement('link');
    const meta = document.createElement('meta');
    t.is(canBeIdentical(link), true);
    t.is(canBeIdentical(meta), true);
});

test('returns true for data-preserve-id', async(t) => {
    const { document } = await setup(true);
    const div = document.createElement('div');
    t.is(canBeIdentical(div), false);
    div.setAttribute('data-preserve-id', 'yes');
    t.is(canBeIdentical(div), true);
});

