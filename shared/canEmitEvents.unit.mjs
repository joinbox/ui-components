import test from 'ava';
import canEmitEvents from './canEmitEvents.mjs';

test('adds and calls handler', (t) => {
    let called = 0;
    const cb = () => { called++; };
    const emitter = Object.assign({}, canEmitEvents);
    emitter.on('name', cb);
    emitter.emit('name');
    emitter.emit('name');
    t.is(called, 2);
});

test('calls callbacks with expected parameters', (t) => {
    const args = [];
    const cb = (...params) => { args.push(params); };
    const emitter = Object.assign({}, canEmitEvents);
    emitter.on('name', cb);
    emitter.emit('name', 1, 2, 3);
    t.deepEqual(args, [[1, 2, 3]]);
});

test('works with multiple handlers', (t) => {
    const args = [];
    const cb = (...params) => { args.push(params); };
    const emitter = Object.assign({}, canEmitEvents);
    emitter.on('name', cb);
    emitter.on('name', cb);
    emitter.emit('name', 1);
    t.deepEqual(args, [[1], [1]]);
});

test('removes all handlers of type', (t) => {
    let called = 0;
    const cb = () => { called++; };
    const emitter = Object.assign({}, canEmitEvents);
    emitter.on('name', cb);
    emitter.emit('name');
    emitter.off('name');
    emitter.emit('name');
    t.deepEqual(called, 1);
});

test('removes all handlers of type and with given callback', (t) => {
    let called = [];
    const cb1 = () => { called.push(1); };
    const cb2 = () => { called.push(2); };
    const emitter = Object.assign({}, canEmitEvents);
    emitter.on('name', cb1);
    emitter.on('name', cb2);
    emitter.emit('name');
    emitter.off('name', cb1);
    emitter.emit('name');
    t.deepEqual(called, [1, 2, 2]);
});

test('does not fail if inexistent handler is removed', (t) => {
    const emitter = Object.assign({}, canEmitEvents);
    t.notThrows(() => emitter.off('name'));
});
