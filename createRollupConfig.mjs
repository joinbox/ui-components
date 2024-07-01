import terser from '@rollup/plugin-terser';

/**
* Creates a simple rollup config from the files passed in
* @param {string[]} files       file names/paths that should be rolled up
*/
export default (files, format = 'iife', minify = true) => files.map((file) => ({
    input: `src/${file}`,
    output: [
        ...(
            minify
                ? [{
                    // Convert file endings to .min.js
                    file: file.replace(/\.m?js$/, '.min.js'),
                    format,
                    plugins: [terser()],
                }]
                : []
        ),
        {
            // Convert file endings to .js
            file: file.replace(/\.m?js$/, '.js'),
            format,
        },
    ],
}));
