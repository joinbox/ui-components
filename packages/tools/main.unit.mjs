import test from 'ava';
import { once, debounce, readAttribute } from './main.mjs';

test('exports modules', (t) => {
    t.is(typeof once, 'function');
    t.is(typeof debounce, 'function');
    t.is(typeof readAttribute, 'function');
});