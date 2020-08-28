/**
 * Mixin for a component that announces itself by dispatching an event
 * @example 
 * class extends HTMLElement {
 *     constructor() {
 *         Object.assign(this, canRegisterElements({ eventTarget: this }));
 *     }
 *     connectedCallback() {
 *         this.registerAnnouncements();
 *     }
 * }
 * */
export default ({
    eventName = 'announce-element',
    eventTarget = window, // Does that work?
    eventType,
    eventIdentifier,
    model,
} = {}) => (
    {
        registerAnnouncements() {
            eventTarget.addEventListener(eventName, (ev) => {
                const { detail } = ev;
                if (eventType && detail.eventType !== eventType) return;
                if (eventIdentifier && detail.eventIdentifier !== eventIdentifier) return;
                const { element } = ev.detail;
                if (typeof element.setModel !== 'function') {
                    console.warn(`canRegisterElement: setModel is not a function on announcing element, but ${element.setModel}.`);
                } else {
                    element.setModel(model);
                }
            });
        },
    }
);
