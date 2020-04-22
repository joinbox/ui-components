import test from 'ava';
import getAndValidateAttribute from './getAndValidateAttribute.mjs';


const HTMLElement = class {
    constructor(attributes) {
        this.attributes = attributes;
    }
    getAttribute(name) {
        return this.attributes.get(name);
    }
    hasAttribute(name) {
        return this.attributes.has(name);
    }
};


/**
 * Mocks an DOM element with attribure methods.
 * @param  {Map} attributes    Attributes that the element has
 */
const setupElement = attributes => new HTMLElement(attributes);


test.before(() => {
    global.HTMLElement = HTMLElement;
});
test.after(() => {
    delete global.HTMLElement;
});


test('throws on missing element or name', (t) => {
    t.throws(() => getAndValidateAttribute(), {
        message: /you passed undefined/,
    });
    t.throws(() => getAndValidateAttribute({ name: 'test' }), {
        message: /you passed undefined/,
    });
    // element is not a HTMLElement
    t.throws(() => getAndValidateAttribute({ name: 'test', element: true }), {
        message: /you passed true/,
    });
});


test('returns attribute value', (t) => {
    const element = setupElement(new Map([['data-name', '1']]));
    t.is(getAndValidateAttribute({ element, name: 'data-name' }), '1');
});


test('passes expected arguments to validate', (t) => {
    const element = setupElement(new Map([['data-name', '1']]));
    const args = [];
    const validate = (...params) => {
        args.push(...params);
        return true;
    };
    getAndValidateAttribute({ element, name: 'data-name', validate });
    t.deepEqual(args, ['1']);
});


test('throws on failed validation', (t) => {
    const element = setupElement(new Map([['data-name', '1']]));
    const options = {
        element,
        name: 'data-name',
        validate: () => false,
        errorMessage: 'notSet',
    };
    t.throws(
        () => getAndValidateAttribute(options),
        { message: /did not pass validation, is 1: notSet/ },
    );
});


test('returns isSet attribute', (t) => {
    const element = setupElement(new Map([['data-name']]));
    t.is(getAndValidateAttribute({ element, name: 'data-name', isSet: true }), true);
});


test('throws if isSet attribute is invalid', (t) => {
    const element = setupElement(new Map([['data-name']]));
    const validate = () => false;
    t.throws(() => getAndValidateAttribute({
        element,
        name: 'data-name',
        isSet: true,
        validate,
        errorMessage: 'notSet',
    }), {
        message: /did not pass validation, is true: notSet/,
    });
});


test('validates isSet attribute', (t) => {
    const element = setupElement(new Map([['data-name']]));
    const validate = () => true;
    t.is(getAndValidateAttribute({
        element,
        name: 'data-name',
        isSet: true,
        validate,
    }), true);
});


test('uses correct arguments for isSet validation', (t) => {
    const element = setupElement(new Map([['data-name']]));
    const args = [];
    const validate = (...params) => {
        args.push(...params);
        return true;
    };
    getAndValidateAttribute({
        element,
        name: 'data-name',
        isSet: true,
        validate,
    });
    t.deepEqual(args, [true]);

});







