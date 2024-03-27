import test from 'ava';
import wrapLetters from './wrapLetters.mjs';

test('wraps letters', (t) => {
    const result = wrapLetters('abc ! +5a', (letter) => `|${letter}|`);
    t.is(result.index, 9);
    t.is(result.result, '|a||b||c|| ||!|| ||+||5||a|');
});

test('applies index', (t) => {
    const result = wrapLetters('abc', (letter, index) => `|${index}-${letter}|`);
    t.is(result.result, '|0-a||1-b||2-c|');
});

test('respects higher initial index', (t) => {
    const result = wrapLetters('abc', (letter, index) => `|${index}-${letter}|`, 2);
    t.is(result.result, '|2-a||3-b||4-c|');
});

test('replaces spaces', (t) => {
    const result = wrapLetters('a b  c', (letter) => `|${letter}|`, 0, '&nbsp;');
    t.is(result.result, '|a||&nbsp;||b||&nbsp;||&nbsp;||c|');
});

test('does not split within html character entities', (t) => {
    const result = wrapLetters('a&nbsp;c', (letter) => `|${letter}|`);
    t.is(result.result, '|a||&nbsp;||c|');
});
