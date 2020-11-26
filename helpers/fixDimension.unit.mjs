import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['fixDimension.export.js'], hideErrors });
};

test('fails with invalid element', async(t) => {
    const { document, errors } = await setup(true);
    const script = document.createElement('script');
    script.textContent = `
        fixDimension();
    `;
    document.body.appendChild(script);
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('instance of HTMLElement'), true);
});

test('fails with invalid dimension', async(t) => {
    const { document, errors } = await setup(true);
    const script = document.createElement('script');
    script.textContent = `
        fixDimension(document.querySelector('body'), other);
    `;
    document.body.appendChild(script);
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('other'), true);
});

test('fixes dimensions', async(t) => {
    const { document, errors, window } = await setup(true);

    window.HTMLElement.prototype.getBoundingClientRect = () => ({ height: 40, width: 50 });

    const widthDiv = document.createElement('div');
    widthDiv.classList.add('widthDiv');
    widthDiv.textContent = 'test';
    document.body.appendChild(widthDiv);

    const heightDiv = document.createElement('div');
    heightDiv.classList.add('heightDiv');
    heightDiv.textContent = 'test';
    document.body.appendChild(heightDiv);

    const script = document.createElement('script');
    script.textContent = `
        fixDimension(document.querySelector('.widthDiv'), 'width');
        fixDimension(document.querySelector('.heightDiv'));
    `;
    document.body.appendChild(script);

    t.is(widthDiv.style.width, '50px');
    t.is(widthDiv.style.overflowY, 'hidden');
    t.is(heightDiv.style.height, '40px');
    t.is(heightDiv.style.overflowX, 'hidden');

    t.is(errors.length, 0);
});
