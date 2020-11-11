import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['SliderElement.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};

test('does not fail if not all params are set', async(t) => {
    const { document, errors } = await setup(true);
    const slider = document.createElement('slider-component');
    document.body.appendChild(slider);
    t.is(errors.length, 0);
});

test('scrolls to active element', async(t) => {
    const { document, errors, window } = await setup(true);
    let scrolledElement;
    window.HTMLElement.prototype.scrollIntoView = function() { scrolledElement = this };
    const slider = createElement(document, '<slider-component data-active-content-selector=".active"><div></div><div class="active"></div></slider-component>');
    document.body.appendChild(slider);
    t.is(scrolledElement, slider.querySelector('.active'));
    t.is(errors.length, 0);
});

test('scrolls on button click', async(t) => {
    const { document, errors, window } = await setup(true);
    const scrolls = [];
    // https://github.com/jsdom/jsdom/issues/2342; JSDOM does not know layout
    Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', { value: 50 });
    window.HTMLElement.prototype.scrollBy = function(params) { scrolls.push(params.left) };
    const slider = createElement(document, '<div><div class="prev"></div><slider-component data-next-button-selector=".next" data-previous-button-selector=".prev" data-disabled-button-class-name="disabled"></slider-component><div class="next"></div></div>');
    document.body.appendChild(slider);
    slider.querySelector('.next').click();
    slider.querySelector('.prev').click();
    t.deepEqual(scrolls, [50, -50]);
    t.is(errors.length, 0);
});

test('disables buttons if content is narrower than container', async(t) => {
    const { document, errors, window } = await setup(true);
    // https://github.com/jsdom/jsdom/issues/2342; JSDOM does not know layout
    Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', { value: 50 });
    Object.defineProperty(window.HTMLElement.prototype, 'scrollWidth', { value: 40 });
    const slider = createElement(document, '<div><div class="prev"></div><slider-component data-next-button-selector=".next" data-previous-button-selector=".prev" data-disabled-button-class-name="disabled"></slider-component><div class="next"></div></div>');
    document.body.appendChild(slider);
    await new Promise(resolve => window.requestAnimationFrame(resolve));
    t.is(slider.querySelector('.next').classList.contains('disabled'), true);
    t.is(slider.querySelector('.prev').classList.contains('disabled'), true);
    t.is(errors.length, 0);
});

test('enables buttons if necessary after DOM is mutated or window is resized', async(t) => {
    const { document, errors, window } = await setup(true);
    // https://github.com/jsdom/jsdom/issues/2342; JSDOM does not know layout
    Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', { value: 50 });
    Object.defineProperty(window.HTMLElement.prototype, 'scrollWidth', { value: 40, writable: true });
    const slider = createElement(document, '<div><div class="prev"></div><slider-component data-next-button-selector=".next" data-previous-button-selector=".prev" data-disabled-button-class-name="disabled"></slider-component><div class="next"></div></div>');
    document.body.appendChild(slider);
    await new Promise(resolve => window.requestAnimationFrame(resolve));
    t.is(slider.querySelector('.next').classList.contains('disabled'), true);

    // Fake wider width after DOM update
    window.HTMLElement.prototype.scrollWidth = 150;
    slider.querySelector('slider-component').innerHTML += '<span>New</span>';
    await new Promise(resolve => window.requestAnimationFrame(resolve));
    t.is(slider.querySelector('.next').classList.contains('disabled'), false);

    // Fake narrower width after window resize
    window.HTMLElement.prototype.scrollWidth = 40;
    window.dispatchEvent(new window.Event('resize'));
    await new Promise(resolve => window.requestAnimationFrame(resolve));
    t.is(slider.querySelector('.next').classList.contains('disabled'), true);

    t.is(errors.length, 0);
});


test('updates button visibility on scroll', async(t) => {
    const { document, errors, window } = await setup(true);
    window.requestAnimationFrame = cb => cb();
    // https://github.com/jsdom/jsdom/issues/2342; JSDOM does not know layout
    Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', { value: 50 });
    Object.defineProperty(window.HTMLElement.prototype, 'scrollWidth', { value: 150 });
    const all = createElement(document, '<div><div class="prev"></div><slider-component data-next-button-selector=".next" data-previous-button-selector=".prev" data-disabled-button-class-name="disabled"></slider-component><div class="next"></div></div>');
    document.body.appendChild(all);
    const slider = all.querySelector('slider-component');
    const prevButton = all.querySelector('.prev');
    const nextButton = all.querySelector('.next');
    t.is(prevButton.classList.contains('disabled'), true);
    t.is(nextButton.classList.contains('disabled'), false);

    // Scroll a bit
    slider.scrollLeft = 50;
    slider.dispatchEvent(new window.Event('scroll'));
    // Await debounce
    await new Promise(resolve => setTimeout(resolve, 50));
    t.is(prevButton.classList.contains('disabled'), false);
    t.is(nextButton.classList.contains('disabled'), false);

    // Scroll to the end
    slider.scrollLeft = 100;
    slider.dispatchEvent(new window.Event('scroll'));
    // Await debounce
    await new Promise(resolve => setTimeout(resolve, 50));
    t.is(prevButton.classList.contains('disabled'), false);
    t.is(nextButton.classList.contains('disabled'), true);

    t.is(errors.length, 0);
});
