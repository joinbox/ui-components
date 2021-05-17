import test from 'ava';
import createDebounce from './createDebounce.mjs';

test('waits with execution', async(t) => {
    const debounce = createDebounce();
    let called = 0;
    const call = () => called++;
    debounce(call, 5);
    t.is(called, 0);
    await new Promise(resolve => setTimeout(resolve, 5));
    t.is(called, 1);
});

test('debounce re-starts timer', async(t) => {
    const debounce = createDebounce();
    let called = 0;
    const call = () => called++;
    debounce(call, 5);
    await new Promise(resolve => setTimeout(resolve, 2));
    debounce(call, 5);
    await new Promise(resolve => setTimeout(resolve, 2));
    debounce(call, 2);
    await new Promise(resolve => setTimeout(resolve, 2));
    t.is(called, 1);
});
