// Hypothesis: A word consists of non-space characters, followed by any number of space characters.
export default (text) => text.match(/\s*\S+\s*/g) || [text];
