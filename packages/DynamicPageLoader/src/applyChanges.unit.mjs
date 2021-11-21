import { dirname } from 'path';
import { fileURLToPath } from 'url';
import test from 'ava';
import getDOM from '../../../src/testHelpers/getDOM.mjs';
import applyChanges from './applyChanges.mjs';

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
            <div data-preserve-id="div" class="original">test</div>
        </div>
    `);
    const originalPreserved = originalNode.querySelector('[data-preserve-id]');
    const newNode = createElement(document, `
        <div>
            <!-- Class name of this element will not be applied, as original is preserved -->
            <div data-preserve-id="div" class="new">test</div>
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

    // .to-be-preserved is kept
    const preserve = originalNode.querySelectorAll('[data-preserve-id="div"]');
    t.is(preserve.length, 1);
    // Attributes are not updated by default
    t.is(preserve[0].getAttribute('class'), 'original');
    // Check that original preserved element is re-used (instead of new element)
    t.is(originalNode.querySelector('[data-preserve-id]'), originalPreserved);

    // .newly-added is added
    t.is(originalNode.querySelectorAll('.newly-added').length, 1);

    t.is(originalNode.children.length, 2);
    t.is(errors.length, 0);
});


test('works without preserved elements', async(t) => {
    const { document, errors } = await setup(true);
    const originalNode = createElement(document, `
        <div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    `);
    const newNode = createElement(document, `
        <div>
            <p></p>
            <p></p>
            <p></p>
        </div>
    `);
    applyChanges({
        originalNode,
        newNode,
        canBeIdentical: () => false,
        isIdentical: () => false,
    });

    t.is(originalNode.children.length, 3);
    // All children are <p>s
    t.is(Array.from(originalNode.children).every(child => child.tagName === 'P'), true);
    t.is(errors.length, 0);
});


test('updates attributes on preserved element if passed', async(t) => {
    const { document, errors } = await setup(true);
    const originalNode = createElement(document, `
        <div>
            <div data-preserve-id="div" data-to-remove data-to-update="originalValue">test</div>
        </div>
    `);
    const newNode = createElement(document, `
        <div>
            <div data-preserve-id="div" data-to-update="newValue">test</div>
        </div>
    `);
    applyChanges({
        originalNode,
        newNode,
        canBeIdentical: element => element.hasAttribute('data-preserve-id'),
        isIdentical: (a, b) => a.dataset.preserveId === b.dataset.preserveId,
        updateAttributes: (origin, target) => {
            target.removeAttribute('data-to-remove');
            target.setAttribute('data-to-update', origin.getAttribute('data-to-update'));
        },
    });

    const preserve = originalNode.querySelector('[data-preserve-id]');
    t.is(preserve.hasAttribute('data-to-remove'), false);
    t.is(preserve.getAttribute('data-to-update'), 'newValue');
    t.is(errors.length, 0);
});



test('works with new nodes from updateNode', async(t) => {
    const { document, errors } = await setup(true);
    const originalNode = createElement(document, `
        <div>
            <!-- Add some empty DIVs to see if everything works as expected -->
            <div></div>
        </div>
    `);
    const newNode = createElement(document, `
        <div>
            <div></div>
            <span class="to-be-modified"></span>
            <div></div>
        </div>
    `);
    applyChanges({
        originalNode,
        newNode,
        canBeIdentical: () => false,
        isIdentical: () => false,
        updateNode: (node) => {
            // If we do not update an existing element, but return a new one, things used to fail,
            // as the original element could not be referenced any more.Check this case
            // explicitly.
            if (node.classList.contains('to-be-modified')) {
                const clonedNode = document.createElement('div');
                clonedNode.classList.add('added-class');
                clonedNode.classList.add('to-be-modified');
                return clonedNode;
            }
            return node;
        },
    });
    const modified = originalNode.querySelector('.to-be-modified');
    t.is(modified.classList.contains('added-class'), true);
    t.is(errors.length, 0);
});



test('adds preserved elements if they did not exist before', async(t) => {
    const { document, errors } = await setup(true);
    const originalNode = createElement(document, `
        <div>
            <div></div>
        </div>
    `);
    const newNode = createElement(document, `
        <div>
            <div></div>
            <span data-preserve-id="yes"></span>
        </div>
    `);
    applyChanges({
        originalNode,
        newNode,
        canBeIdentical: element => element.hasAttribute('data-preserve-id'),
        isIdentical: (a, b) => a.dataset.preserveId === b.dataset.preserveId,
    });
    const preserved = originalNode.querySelectorAll('[data-preserve-id="yes"]');
    t.is(preserved.length, 1);
    t.is(errors.length, 0);
});


/* test('does not re-order elements if not needed', async(t) => {
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

}); */



test('updates order of elements if needed', async(t) => {
    const { window, document, errors } = await setup(true);

    const originalNode = createElement(document, `
        <div>
            <div data-preserve-id="first"></div>
            <div data-preserve-id="second"></div>
            <div data-preserve-id="third"></div>
        </div>
    `);
    const newNode = createElement(document, `
        <div>
            <div data-preserve-id="second"></div>
            <div data-preserve-id="third"></div>
            <div data-preserve-id="first"></div>
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
    t.is(originalNode.children[1].getAttribute('data-preserve-id'), 'third');
    t.is(originalNode.children.length, 3);
    // disconnectedCounter was defined and executed
    // insertBefore does not seem to trigger disconnectedCallback
    // t.is(window.disconnectedCounter, 1);
    t.is(errors.length, 0);

});

