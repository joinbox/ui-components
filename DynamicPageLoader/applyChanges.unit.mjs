import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../testHelpers/getDOM.mjs';
import applyChanges from './applyChanges.mjs'

const setup = async(hideErrors) => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    return getDOM({ basePath, scripts: [], hideErrors });
};

const createElement = (document, html) => {
    const container = document.createElement('div');
    container.innerHTML = html.replace(/\s+/g, ' ').trim();
    return container.firstChild;
};

test('dispatches urlchange event and updates state', async(t) => {
    const { document, errors } = await setup(true);
    const originalNode = createElement(document, `
        <div>
            <div class="to-be-deleted"></div>
            <div class="to-be-preserved" data-preserve-id="div">test</div>
        </div>
    `);
    const newNode = createElement(document, `
        <div>
            <div class="irrelevant-class-name-as-it-is-ignored" data-preserve-id="div">test</div>
            <span class="to-be-modified"></span>
            <div class="newly-added"></div>
        </div>
    `);
    applyChanges({
        originalNode,
        newNode,
        canBeIdentical: element => element.hasAttribute('data-preserve-id'),
        isIdentical: (a, b) => a.dataset.preserveId === b.dataset.preserveId,
        updateNode: (node) => {
            if (node.tagName === 'SPAN') {
                node.classList.add('added-class');
            }
            return node;
        },
    });
    t.is(originalNode.querySelector('.to-be-deleted'), null);
    t.is(originalNode.querySelectorAll('.to-be-preserved').length, 1);
    t.is(originalNode.querySelectorAll('.newly-added').length, 1);
    const modified = originalNode.querySelector('.to-be-modified');
    t.is(modified.classList.contains('added-class'), true);
    t.is(errors.length, 0);
});
