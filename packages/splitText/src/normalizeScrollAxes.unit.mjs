import test from 'ava';
import normalizeScrollAxes from './normalizeScrollAxes.mjs';

test('normalizes scroll axes', (t) => {
    t.deepEqual(normalizeScrollAxes(true), ['x', 'y']);
    t.deepEqual(normalizeScrollAxes(['x']), ['x']);
    t.deepEqual(normalizeScrollAxes(['y']), ['y']);
    t.deepEqual(normalizeScrollAxes(['x', 'y']), ['x', 'y']);
    t.deepEqual(normalizeScrollAxes(['x', 'y', 'z']), ['x', 'y']);
    t.deepEqual(normalizeScrollAxes(false), []);
});

test('throws on invalid arguments', (t) => {
    const error = t.throws(() => normalizeScrollAxes(5));
    t.is(error.message.match(/Invalid argument for axes/).length, 1);
});
