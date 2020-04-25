import { join } from 'path';
import jsdom from 'jsdom';
import { rollup } from 'rollup';

const { JSDOM } = jsdom;

/**
 * Creates an empty DOM with error handling, loads and injects specified JS files.
 * @param {string[]} options.scripts          Path to the JS files that should be loaded
 * @param {string} options.basePath           Base path for scripts
 * @param {boolean} options.hideErrors        If true, jsdomError will only be added to errors but
 *                                            not displayed (good to test if exceptions are thrown
 *                                            as console is not cluttered)
 * @return {object}
 */
export default async({ basePath, scripts, hideErrors } = {}) => {

    const errors = [];
    const virtualConsole = new jsdom.VirtualConsole();
    // dirname prefixes paths with file:/// which are not understood by rollup. Remove prefix.
    const baseWithoutPrefix = basePath.replace(/^file:\/{2}/, '');
    const { window } = new JSDOM('', {
        runScripts: 'dangerously',
        virtualConsole,
        // add requestAnimationFrame support
        pretendToBeVisual: true,
    });
    const { document } = window;

    virtualConsole.on('jsdomError', (err) => {
        if (!hideErrors) console.error(err);
        errors.push(err);
    });
    // Propagate logs to the terminal's console
    virtualConsole.on('log', (...text) => console.log(...text));
    virtualConsole.on('warn', (...text) => console.warn(...text));
    virtualConsole.on('error', (...text) => console.error(...text));

    for await (const scriptFile of scripts) {
        const inputOptions = {
            input: join(baseWithoutPrefix, scriptFile),
        };
        const outputOptions = {
            format: 'es',
        };
        const bundle = await rollup(inputOptions);
        const { output } = await bundle.generate(outputOptions);
        const scriptElement = document.createElement('script');
        scriptElement.textContent = output[0].code;
        document.body.appendChild(scriptElement);
    }
    return { window, document, errors };
};
