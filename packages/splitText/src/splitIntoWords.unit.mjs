import test from 'ava';
import splitIntoWords from './splitIntoWords.mjs';

test('splits text into words', (t) => {
    t.deepEqual(splitIntoWords('Hello World!'), ['Hello ', 'World!']);
    // Special characters
    t.deepEqual(splitIntoWords('Heööo World! '), ['Heööo ', 'World! ']);
    t.deepEqual(splitIntoWords('Heööo – World'), ['Heööo ', '– ', 'World']);
    // Starting with a space
    t.deepEqual(splitIntoWords(' Hello World!'), [' Hello ', 'World!']);
    // Weird spaces
    t.deepEqual(splitIntoWords('Hello\tWorld\n!'), ['Hello\t', 'World\n', '!']);
    // Multiple spaces
    t.deepEqual(splitIntoWords('Hello   World'), ['Hello   ', 'World']);
    // Spaces at beginning/end
    t.deepEqual(splitIntoWords('  Hello World  '), ['  Hello ', 'World  ']);
    // Dashes
    t.deepEqual(splitIntoWords('Hello-World'), ['Hello-', 'World']);
    t.deepEqual(splitIntoWords('-Hello- World -'), ['-Hello- ', 'World -']);
    // Special dash
    t.deepEqual(splitIntoWords('a‐b‒c﹣d－e'), ['a‐', 'b‒', 'c﹣', 'd－', 'e']);
});

test('no-match returns empty array', (t) => {
    t.deepEqual(splitIntoWords('  '), ['  ']);
});
