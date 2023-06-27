/**
 * Simple debounce implementation. See README.
*/
export default () => {
    let timeout;
    return (callback, offset) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(callback, offset);
    };
};
