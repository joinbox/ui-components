import splitTags from './splitTags.mjs';
import test from 'ava';

test('splits html', (t) => {
    const htmlString = '1 2 <a>3</a> 4';
    const result = splitTags(htmlString);
    t.deepEqual(result, [
        { type: 'text', value: '1 2 ' },
        { type: 'tag', value: '<a>' },
        { type: 'text', value: '3' },
        { type: 'tag', value: '</a>' },
        { type: 'text', value: ' 4' },
    ]);
    // Also works if html string begins and ends with tags
    const htmlStringWrappedInTags = '<a>3</a>';
    const resultWrappedInTags = splitTags(htmlStringWrappedInTags);
    t.deepEqual(resultWrappedInTags, [
        { type: 'tag', value: '<a>' },
        { type: 'text', value: '3' },
        { type: 'tag', value: '</a>' },
    ]);
});

test('splits nested html tags', (t) => {
    const htmlString = '<a>3<b>4</b></a>';
    const result = splitTags(htmlString);
    t.deepEqual(result, [
        { type: 'tag', value: '<a>' },
        { type: 'text', value: '3' },
        { type: 'tag', value: '<b>' },
        { type: 'text', value: '4' },
        { type: 'tag', value: '</b>' },
        { type: 'tag', value: '</a>' },
    ]);
});

test('splits html with attributes', (t) => {
    const htmlString = '<a b="n" c="m">3</a>4';
    const result = splitTags(htmlString);
    t.deepEqual(result, [
        { type: 'tag', value: '<a b="n" c="m">' },
        { type: 'text', value: '3' },
        { type: 'tag', value: '</a>' },
        { type: 'text', value: '4' },
    ]);
});
