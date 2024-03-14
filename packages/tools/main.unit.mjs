import test from 'ava';
import { once, debounce, readAttribute, measureElement } from './main.mjs';

test('exports modules', (t) => {
    t.is(typeof once, 'function');
    t.is(typeof debounce, 'function');
    t.is(typeof readAttribute, 'function');
    t.is(typeof measureElement, 'function');
});