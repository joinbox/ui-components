import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';
import Template from './Template.mjs';

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: [], hideErrors });
};


const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container;
};

test('replaces content of container with content of the provided template', async(t) => {
    const { document, errors } = await setup(true);

    const content = createElement(document,
        `<div data-content-container>Initial</div>
        <template data-loading-template>Loading ...</template>`);
    document.body.appendChild(content);

    const containerSelector = '[data-content-container]';
    const template = new Template(content, containerSelector);
    const container = document.querySelector(containerSelector);
    t.is(container.innerHTML, 'Initial');

    template.generateContent(['[data-loading-template]']);
    t.is(container.innerHTML, 'Loading ...');

    t.is(errors.length, 0);
});

test('replaces content of container with content of first template that matches selectors', async(t) => {
    const { document, errors } = await setup(true);

    const content = createElement(document,
        `<div data-content-container>Initial</div>
        <template data-first-content-template>First Content</template>
        <template data-second-content-template>Second Content</template>`);
    document.body.appendChild(content);

    const containerSelector = '[data-content-container]';
    const template = new Template(content, containerSelector);
    const container = document.querySelector(containerSelector);
    t.is(container.innerHTML, 'Initial');

    template.generateContent(['[data-second-content-template]', '[data-first-content-template]']);
    t.is(container.innerHTML, 'Second Content');

    t.is(errors.length, 0);
});

test('puts provided content in container', async(t) => {
    const { document, errors } = await setup(true);

    const content = createElement(document,
        `<div data-content-container>Initial</div>`);
    document.body.appendChild(content);

    const containerSelector = '[data-content-container]';
    const template = new Template(content, containerSelector);
    const container = document.querySelector(containerSelector);
    t.is(container.innerHTML, 'Initial');

    template.setContent('New Content');
    t.is(container.innerHTML, 'New Content');

    t.is(errors.length, 0);
});

test('replaces placeholders in template content with provided replacement values', async(t) => {
    const { document, errors } = await setup(true);

    const content = createElement(document,
        `<div data-content-container>Initial</div>
        <template data-content-template>{{Hello}} {{message}}</template>`);
    document.body.appendChild(content);

    const containerSelector = '[data-content-container]';
    const template = new Template(content, containerSelector);
    const container = document.querySelector(containerSelector);
    t.is(container.innerHTML, 'Initial');

    template.generateContent(['[data-content-template]'], {'message': 'World', 'anotherValue': 'thatHasNowhereToGo'});
    t.is(container.innerHTML, '{{Hello}} World');

    t.is(errors.length, 0);
});


test('throws errors if container or template are not found', async(t) => {
    const { document } = await setup(true);

    const content = createElement(document,
        `<div data-content-container>Initial</div>`);
    document.body.appendChild(content);

    t.throws(() => {
        new Template(content, '[data-false-content-container]');
    }, { message: /Could not find container/ });

    const template = new Template(content, '[data-content-container]');

    t.throws(() => {
        template.generateContent(['[data-loading-template]'], null, true);
    }, { message: /Could not find child element that/ });
});
