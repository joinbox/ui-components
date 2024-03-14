import test from 'ava';
import readAttribute from './readAttribute.mjs';

/**
 * Creates a fake element that only provides a getAttribute method and returns the attributes
 * passed in
 * @param {object} attributes   Key: attribute name; value: attribute's value.
 * @returns *
 */
const createElement = (attributes = {}) => ({
    getAttribute: (name) => attributes[name],
    outerHTML: '[outer]',
});

test('reads attribute', (t) => {
    const element = createElement({ name: 'value' });
    t.is(readAttribute(element, 'name'), 'value');
    t.is(readAttribute(element, 'unknownName'), undefined);
});

test('transforms attribute', (t) => {
    const element = createElement({ name: '0' });
    t.is(readAttribute(element, 'name', { transform: (value) => parseInt(value, 10) }), 0);
});

test('validates attribute', (t) => {
    const element = createElement();
    // Without expectation
    t.throws(
        () => readAttribute(element, 'name', { validate: (value) => !!value}),
        { message: /Expected attribute name of element \[outer\] to be \(expectation not provided\); got undefined instead/ },
    );
    // With expectation
    t.throws(
        () => readAttribute(
            element,
            'name',
            { validate: (value) => !!value, expectation: 'trueish' },
        ),
        { message: /Expected attribute name .* to be trueish; got undefined instead \(undefined before/ },
    );
    t.notThrows(() => readAttribute(element, 'name', { validate: (value) => !value }));
});

test('transforms attribute before validation', (t) => {
    // Test order of validate vs transform; transformation should happen before validation
    const element = createElement({ name: '10' });
    const additionalArguments = {
        transform: (value) => parseInt(value, 10),
        validate: (value) => !Number.isNaN(value),
        expectation: 'a number',
    };
    t.notThrows(() => readAttribute(element, 'name', additionalArguments));
    t.throws(() => readAttribute(createElement(), 'name', additionalArguments));
});

