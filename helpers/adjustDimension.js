/* global requestAnimationFrame */

export default (element, dimension = 'height', value) => {

    if (!['height', 'width'].includes(dimension)) {
        throw new Error(`adjustDimension: Either pass 'height' or 'width' as value for dimension; you used ${dimension} instead.`);
    }
    if (!(element instanceof HTMLElement)) {
        throw new Error(`adjustDimension: Provide an instance of HTMLElement as element argument, you used ${element} instead.`);
    }

    const scrollWidthProperty = dimension === 'height' ? 'scrollHeight' : 'scrollWidth';

    if (value === undefined) value = element[scrollWidthProperty];
    // Height was set to a fixed value just before in fixDimensions. If we set it to the new
    // value within the same loop, it will not animate, as fixDimensions has not taken effect and
    // the previous value may still be 'auto'
    requestAnimationFrame(() => {
        console.log('raf');
        requestAnimationFrame(() => { element.style[dimension] = `${value}px`; });
    });

    const transitionEndHandler = (ev) => {
        console.log(ev.currentTarget, ev.propertyName);
        // Only handle transitionend on correct element (it bubbles) and property
        if (ev.currentTarget !== element) return;
        if (ev.propertyName !== dimension) return;
        element.removeEventListener('transitionend', transitionEndHandler);
        element.removeEventListener('transitioncancel', transitionEndHandler);
        element.style.removeProperty(dimension);
        const axis = dimension === 'height' ? 'x' : 'y';
        element.style.removeProperty(`overflow-${axis}`);
    };

    element.addEventListener('transitionend', transitionEndHandler);
    element.addEventListener('transitioncancel', transitionEndHandler);

};


