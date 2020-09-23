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

test('updates dom as expected', async(t) => {
    const { document, errors } = await setup(true);
    const originalNode = createElement(document, `
        <div>
            <div class="to-be-deleted"></div>
            <div class="to-be-preserved" data-preserve-id="div">test</div>
        </div>
    `);
    const newNode = createElement(document, `
        <div>
            <!-- Class name of this element will not be applied, as original is preserved -->
            <div class="ignored-class-name" data-preserve-id="div">test</div>
            <div class="newly-added"></div>
        </div>
    `);
    applyChanges({
        originalNode,
        newNode,
        canBeIdentical: element => element.hasAttribute('data-preserve-id'),
        isIdentical: (a, b) => a.dataset.preserveId === b.dataset.preserveId,
    });

    // .to-be-deleted is removed
    t.is(originalNode.querySelector('.to-be-deleted'), null);

    // .to-be-preserved is kept; class is not added
    const preserve = originalNode.querySelectorAll('.to-be-preserved');
    t.is(preserve.length, 1);
    t.is(preserve[0].classList.contains('ignored-class-name'), false);

    // .newly-added is added
    t.is(originalNode.querySelectorAll('.newly-added').length, 1);

    t.is(originalNode.children.length, 2);
    t.is(errors.length, 0);
});




test('calls updateNode if passed', async(t) => {
    const { document, errors } = await setup(true);
    const originalNode = createElement(document, `
        <div>
        </div>
    `);
    const newNode = createElement(document, `
        <div>
            <span class="to-be-modified"></span>
        </div>
    `);
    applyChanges({
        originalNode,
        newNode,
        canBeIdentical: () => false,
        isIdentical: () => false,
        updateNode: (node) => {
            if (node.classList.contains('to-be-modified')) {
                node.classList.add('added-class');
            }
            return node;
        },
    });
    const modified = originalNode.querySelector('.to-be-modified');
    t.is(modified.classList.contains('added-class'), true);
    t.is(errors.length, 0);
});



test('does not re-order elements if not needed', async(t) => {
    const { window, document, errors } = await setup(true);

    // Create a custom element to detect changes in the DOM (via disconnectedCallback)
    const script = document.createElement('script');
    script.textContent = `
        class ChangeLogger extends window.HTMLElement {
            disconnectedCallback() {
                if (!window.disconnectedCounter) window.disconnectedCounter = 0;
                window.disconnectedCounter++;
            }
        }
        window.customElements.define('change-logger', ChangeLogger);
    `;
    document.body.appendChild(script);

    const originalNode = createElement(document, `
        <div>
            <change-logger data-preserve-id="first"></change-logger>
            <!-- Add some divs to see if they cause issues with the order -->
            <div></div>
            <change-logger data-preserve-id="second"></change-logger>
            <change-logger data-preserve-id="third"></change-logger>
        </div>
    `);
    const newNode = createElement(document, `
        <div>
            <div></div>
            <change-logger data-preserve-id="first"></change-logger>
            <div></div>
            <change-logger data-preserve-id="second"></change-logger>
            <change-logger data-preserve-id="third"></change-logger>
            <div></div>
        </div>
    `);
    applyChanges({
        originalNode,
        newNode,
        canBeIdentical: element => element.hasAttribute('data-preserve-id'),
        isIdentical: (a, b) => a.dataset.preserveId === b.dataset.preserveId,
    });
    t.is(originalNode.children.length, 6);
    // disconnectedCounter was never defined
    t.is(window.disconnectedCounter, undefined);
    t.is(errors.length, 0);

});



test('updates order of elements if needed', async(t) => {
    const { window, document, errors } = await setup(true);

    // Create a custom element to detect changes in the DOM (via disconnectedCallback)
    const script = document.createElement('script');
    script.textContent = `
        class ChangeLogger extends window.HTMLElement {
            disconnectedCallback() {
                if (!window.disconnectedCounter) window.disconnectedCounter = 0;
                window.disconnectedCounter++;
            }
        }
        window.customElements.define('change-logger', ChangeLogger);
    `;
    document.body.appendChild(script);

    const originalNode = createElement(document, `
        <div>
            <change-logger data-preserve-id="first"></change-logger>
            <change-logger data-preserve-id="second"></change-logger>
        </div>
    `);
    const newNode = createElement(document, `
        <div>
            <change-logger data-preserve-id="second"></change-logger>
            <change-logger data-preserve-id="first"></change-logger>
        </div>
    `);
    applyChanges({
        originalNode,
        newNode,
        canBeIdentical: element => element.hasAttribute('data-preserve-id'),
        isIdentical: (a, b) => a.dataset.preserveId === b.dataset.preserveId,
    });

    // Check if order was changed
    t.is(originalNode.children[0].getAttribute('data-preserve-id'), 'second');
    // disconnectedCounter was defined and executed
    // insertBefore does not seem to trigger disconnectedCallback
    // t.is(window.disconnectedCounter, 1);
    t.is(errors.length, 0);

});

