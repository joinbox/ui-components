import test from 'ava';
import getRelativeTimeUnitAndValue from './getRelativeTimeUnitAndValue.mjs';

test('returns the correct unit and value for a given date', (t) => {
    const testData = [
        [0, { value: 0, unit: 'minute' }],
        [1000 * 60, { value: 1, unit: 'minute' }],
        // Rounding
        [500 * 60, { value: 1, unit: 'minute' }],
        [1499 * 60, { value: 1, unit: 'minute' }],
        [1500 * 60, { value: 2, unit: 'minute' }],
        // Rest
        [1000 * 60 * 60, { value: 1, unit: 'hour' }],
        [1000 * 60 * 60 * 48, { value: 2, unit: 'day' }],
        [1000 * 60 * 60 * 24 * 14, { value: 2, unit: 'week' }],
        [1000 * 60 * 60 * 24 * 60, { value: 2, unit: 'month' }],
        [1000 * 60 * 60 * 24 * 365, { value: 1, unit: 'year' }],
        // Negative values
        [-1000 * 60 * 60, { value: -1, unit: 'hour' }],
    ];
    testData.forEach(([input, expectation]) => {
        t.deepEqual(getRelativeTimeUnitAndValue(input), expectation);
    });
});
