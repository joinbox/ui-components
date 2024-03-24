import createRollupConfig from '../../createRollupConfig.mjs';

const components = [
    'OverlayElement.js',
    'OverlayButtonElement.js',
    // Expose the original element so that developers are able to extend it
    'Overlay.js',
];
const rollupConfig = createRollupConfig(components);
// Export Overlay.js as ES module
rollupConfig.at(-1).output.format = 'es';

export default rollupConfig;
