import test from 'ava';
import { once, createDebounce, readAttribute } from './main.mjs';

test('exports modules', (t) => {
    t.is(typeof once, 'function');
    t.is(typeof createDebounce, 'function');
    t.is(typeof readAttribute, 'function');
});