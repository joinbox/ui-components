import test from 'ava';
import { YouTubePlayer } from './main.mjs';

test('exports all components', (t) => {
    t.is(typeof YouTubePlayer, 'function');
});
