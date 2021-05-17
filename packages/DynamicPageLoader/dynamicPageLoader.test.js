/* global window, document */
(async() => {

    const {
        applyChanges,
        handleLinkClicks,
        handlePopState,
        loadFile,
        canBeIdentical,
        isIdentical,
        createNode,
    } = await import('./index.js');

    const links = document.querySelectorAll('a');

    handleLinkClicks({
        linkElements: links,
        checkLink: link => !link.includes('joinbox.com'),
    });
    handlePopState();

    const animationElement = document.querySelector('.animation');

    window.addEventListener(
        'urlchange',
        async(ev) => {
            const { url } = ev.detail;
            const dom = await loadFile(url);

            // TODO: loadFile and animation *should* run in parallel
            animationElement.classList.add('in');
            await new Promise((resolve) => {
                animationElement.addEventListener('animationend', resolve, { once: true });
            });

            applyChanges({
                originalNode: document.querySelector('body'),
                newNode: dom.querySelector('body'),
                canBeIdentical,
                isIdentical,
                updateNode: node => (node.tagName === 'SCRIPT' ? createNode(document, node) : node),
            });
            applyChanges({
                originalNode: document.querySelector('head'),
                newNode: dom.querySelector('head'),
                canBeIdentical,
                isIdentical,
                updateNode: node => (node.tagName === 'SCRIPT' ? createNode(document, node) : node),
            });
            // To update a preserved DOM element, use a minimal timeOut; if we add the class while
            // the DOM element is being moved, transitions will not happen.
            setTimeout(() => {
                const method = url.includes('about') ? 'add' : 'remove';
                document.querySelector('.header').classList[method]('about');
                // Create animation
                animationElement.classList.add('out');
                animationElement.classList.remove('in');
                animationElement.addEventListener('animationend', () => {
                    animationElement.classList.remove('out');
                }, { once: true });
            });
        },
        // Note once here which is crucial; window will persist over all page changes. If we add
        // the urlchange handler every time, it will fire many times after many page reloads.
        { once: true },
    );


})();
