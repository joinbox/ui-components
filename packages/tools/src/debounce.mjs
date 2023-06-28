/**
 * Simple debounce implementation. See README.
*/
export default (callback, offset) => {
    let timeout;
    return () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(callback, offset);
    };
};
