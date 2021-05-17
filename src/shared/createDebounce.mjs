/**
 * Simple debounce implementation. Use:
 * import { createDebounce } from '@joinbox/ui-components;
 * const debounce = createDebounce();
 * debounce(() => {}), 500);
*/
export default () => {
    let timeout;
    return (callback, offset) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(callback, offset);
    };
};
