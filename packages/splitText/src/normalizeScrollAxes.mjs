/**
 * Valid arguments for resize axes are ['x'], ['y'] or true, false or ['x', 'y']. Convert those
 * to an array of axes ['x', 'y'].
 * @param {boolean|string[]} axes
 * @returns {string[]}
 */
export default (axes) => {
    const allAxes = ['x', 'y'];
    const resizeAxes = [];
    if (axes === true) resizeAxes.push(...allAxes);
    else if (Array.isArray(axes)) {
        axes.forEach((axis) => {
            if (!allAxes.includes(axis)) {
                console.warn('Axis %o is not supported; use one of \'x\' or \'y\'.', axes);
            } else {
                resizeAxes.push(axis);
            }
        });
    } else if (axes !== false) {
        throw new Error(`Invalid argument for axes; use true, false or an array of axes ('x'/'y'); you passed ${JSON.stringify(axes)} instead.`);
    }
    return resizeAxes;
};
