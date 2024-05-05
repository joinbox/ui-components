/* global window */

/**
 * Calls callback with a debounce of 500ms if the window size for one of the axes provided has
 * changed.
 * @param {Object} options
 * @param {string[]} options.axes - ['x'], ['y'], ['x', 'y'] or []
 */
export default ({ axes, callback } = {}) => {
    const getWindowSize = () => ({
        x: window.innerWidth,
        y: window.innerHeight,
    });
    let previousWindowSize = getWindowSize();
    const handleResize = () => {
        const { x, y } = getWindowSize();
        const xChanged = previousWindowSize.x !== x;
        const yChanged = previousWindowSize.y !== y;
        previousWindowSize = { x, y };
        const relevantChange = (xChanged && axes.includes('x')) || (yChanged && axes.includes('y'));
        if (relevantChange) callback();
    };
    window.addEventListener('resize', handleResize);
};
