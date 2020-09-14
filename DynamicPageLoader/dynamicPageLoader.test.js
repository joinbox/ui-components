/* global window, document */
(async() => {

    const {
        applyChanges,
        handleLinkClicks,
        handlePopState,
        loadFile,
        createNode,
    } = await import('./index.js');

    const links = document.querySelectorAll('a');

    handleLinkClicks({
        linkElements: links,
        checkLink: link => !link.includes('joinbox.com'),
    });
    handlePopState();

    window.addEventListener(
        'urlchange',
        async(ev) => {
            const { url } = ev.detail;
            const dom = await loadFile(url);
            applyChanges({
                originalNode: document.querySelector('body'),
                newNode: dom.querySelector('body'),
                canBeIdentical: element => element.hasAttribute('data-preserve-id'),
                isIdentical: (a, b) => a.dataset.preserveId === b.dataset.preserveId,
                updateNode: node => (node.tagName === 'SCRIPT' ? createNode(document, node) : node),
            });
            // To update a preserved DOM element, use a minimal timeOut; if we add the class while
            // the DOM element is being moved, transitions will not happen.
            setTimeout(() => {
                const method = url.includes('about') ? 'add' : 'remove';
                document.querySelector('.header').classList[method]('about');
            });
        },
        // Note once here which is crucial; window will persist over all page changes. If we add
        // the urlchange handler every time, it will fire many times after many page reloads.
        { once: true },
    );


})();
