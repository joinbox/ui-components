// Hypothesis: A word consists of non-space characters, followed by space characters.
// Use a positive lookbehind to combine this logic with split().
export default (text) => text.split(/(?<=\S+\s+)/);
