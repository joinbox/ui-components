import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: ['TableOfContentsElement.js'], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstChild;
};

test('fails with missing attributes', async(t) => {
    const { document, errors } = await setup(true);
    const h2 = createElement(document, '<h2>test</h2>');
    document.body.appendChild(h2);
    // Only test internal errors, not the ones thrown by canReadAttributes
    const toc0 = createElement(document, '<table-of-contents-component data-chapters-selector="h2" data-template-selector="inexistent" data-template-content-selector=".text"></table-of-contents-component>');
    document.body.appendChild(toc0);
    t.is(errors[0].message.includes('selector inexistent not found'), true);
    const toc1 = createElement(document, '<table-of-contents-component data-chapters-selector="h2" data-template-selector="template" data-template-content-selector=".text"><template><div></div></template></table-of-contents-component>');
    document.body.appendChild(toc1);
    t.is(errors[1].message.includes('selector is .text, template <div></div>'), true);
    t.is(errors.length, 2);
});

test('creates table of contents', async(t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = content => content();
    const toc = createElement(document, '<table-of-contents-component data-chapters-selector="h2" data-template-selector="template" data-template-content-selector=".text"><ul><template><li class="item"><span>–</span><span class="text"></span></li></template></ul></table-of-contents-component>');
    const title1 = createElement(document, '<h1>test1</h1>');
    const title2 = createElement(document, '<h2>test2</h2>');
    const title3 = createElement(document, '<h2>test3</h2>');
    document.body.appendChild(title1);
    document.body.appendChild(title2);
    document.body.appendChild(title3);
    document.body.appendChild(toc);
    // Correct amount of titles
    t.is(toc.querySelectorAll('li.item').length, 2);
    // Uses correct content
    t.is(toc.querySelector('li.item').innerHTML, '<span>–</span><span class="text">test2</span>');
    t.is(errors.length, 0);
});

test('scrolls to element, respects offset element', async(t) => {
    const { window, document, errors } = await setup(true);
    // Fake implementation of scrollIntoView that is missing in JSDom
    let scrollOptions = 0;
    window.scrollBy = (options) => {
        scrollOptions = options;
    };
    window.HTMLElement.prototype.getBoundingClientRect = () => ({
        top: 50,
        height: 20,
    });
    window.requestAnimationFrame = content => content();
    const title1 = createElement(document, '<h1>test1</h1>');
    const toc = createElement(document, '<table-of-contents-component data-offset-selector=".stickyMenu" data-chapters-selector="h1" data-template-selector="template" data-template-content-selector=".text"><ul><template><li><span class="text"></span></li></template></ul></table-of-contents-component>');
    const offsetElement = createElement(document, '<div class="stickyMenu"></div>');
    document.body.appendChild(title1);
    document.body.appendChild(toc);
    document.body.appendChild(offsetElement);
    toc.querySelector('span.text').click();
    // Scroll top equals top of h1 minus height of offsetElement
    t.is(scrollOptions.top, 30);
    t.is(errors.length, 0);
});

test('uses offset value', async(t) => {
    const { window, document, errors } = await setup(true);
    // Fake implementation of scrollIntoView that is missing in JSDom
    let scrollOptions = 0;
    window.scrollBy = (options) => {
        scrollOptions = options;
    };
    window.requestAnimationFrame = content => content();
    const title1 = createElement(document, '<h1>test1</h1>');
    const toc = createElement(document, '<table-of-contents-component data-offset-value="50" data-chapters-selector="h1" data-template-selector="template" data-template-content-selector=".text"><ul><template><li><span class="text"></span></li></template></ul></table-of-contents-component>');
    document.body.appendChild(title1);
    document.body.appendChild(toc);
    toc.querySelector('span.text').click();
    // scrollTop is height of title (0) minus the offset – in other words, we must scroll to -50
    // in order for a title starting at 0 to have an offset of 50
    t.is(scrollOptions.top, -50);
    t.is(errors.length, 0);
});


test('adds anchor navigation', async(t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = content => content();
    const h2 = createElement(document, '<h2>test  with ! and space.</h2>');
    const toc = createElement(document, '<table-of-contents-component data-template-link-selector="a" data-chapters-selector="h2" data-template-selector="template" data-template-content-selector=".text"><ul><template><li><a><span class="text"></span></a></li></template></ul></table-of-contents-component>');
    document.body.appendChild(h2);
    document.body.appendChild(toc);
    const id = 'test-with-and-space';
    t.is(h2.getAttribute('id'), id);
    t.is(toc.querySelectorAll(`[href="#${id}"]`).length, 1);
    t.is(errors.length, 0);
});

test('does not modify existing ids on titles', async(t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = content => content();
    const h2 = createElement(document, '<h2 id="existing"></h2>');
    const toc = createElement(document, '<table-of-contents-component data-template-link-selector="a" data-chapters-selector="h2" data-template-selector="template" data-template-content-selector=".text"><ul><template><li><a><span class="text"></span></a></li></template></ul></table-of-contents-component>');
    document.body.appendChild(h2);
    document.body.appendChild(toc);
    const id = 'existing';
    t.is(h2.getAttribute('id'), id);
    t.is(toc.querySelectorAll(`[href="#${id}"]`).length, 1);
    t.is(errors.length, 0);
});

test('updates toc contents on update event', async(t) => {
    const { window, document, errors } = await setup(true);
    window.requestAnimationFrame = content => content();
    const h2No1 = createElement(document, '<h2>h-1</h2>');
    const h2No2 = createElement(document, '<h2>h-2</h2>');
    const toc = createElement(document, '<table-of-contents-component data-update-event-name="updateToc" data-template-link-selector="a" data-chapters-selector="h2" data-template-selector="template" data-template-content-selector=".text"><ul><template><li><a><span class="text"></span></a></li></template></ul></table-of-contents-component>');
    document.body.appendChild(h2No1);
    document.body.appendChild(toc);
    t.is(toc.querySelectorAll('a').length, 1);
    document.body.appendChild(h2No2);
    window.dispatchEvent(new window.CustomEvent('updateToc'));
    t.is(toc.querySelectorAll('a').length, 2);
    t.is(errors.length, 0);
});
