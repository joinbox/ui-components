/**
* Creates a simple rollup config from the files passed in
* @param {string[]} files       file names/paths that should be rolled up
*/
export default (files, format = 'iife') => files.map((file) => ({
    input: `src/${file}`,
    output: {
        // Convert file endings to .js in dist folder
        file: file.replace(/\.mjs$/, '.js'),
        format,
    },
}));
