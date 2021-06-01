import createRollupConfig from '../../createRollupConfig.mjs';
const components = [
    'AudioComponentElement.js',
    'MediaPlayPauseComponentElement.js',
    'MediaTimeComponentElement.js',
    'MediaVolumeComponentElement.js',
];
export default createRollupConfig(components);
