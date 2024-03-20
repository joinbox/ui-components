/* global document */

/**
 * Loads non-inline scripts synchrinously in their order. We might handle async/defer at a later
 * point if there's a real need.
 * @param {string[]} scriptSources - Array of script sources to be loaded
 * @param {Document} document - Document object to be used for creating script elements; injected
 *                              to simplify testing
 */
export default async (scriptSources) => {
    for await (const source of scriptSources) {
        await new Promise((resolve) => {
            const script = document.createElement('script');
            // Only load next script *after* the current one has been loaded (or failed)
            script.addEventListener('load', resolve);
            script.addEventListener('error', resolve);
            script.setAttribute('src', source);
            document.body.appendChild(script);
        });
    }
};
