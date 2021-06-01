export default (text, wrapLetter, startIndex) => {

    let index = startIndex;

    // Wrap every single letter within the current part
    const wrapped = text
        .split('')
        .map((letter) => {
            const lettered = wrapLetter(letter, index);
            index++;
            return lettered;
        })
        .join('');

    return { index, result: wrapped };

};

