/**
 * Mixin for a component that announces itself by dispatching an event. If another element handles
 * the event, it may pass the model to the current component by calling setModel(). The model will
 * be stored in this.model. After model is set, this.onModelChange is called, if available.
 * @example
 * class extends HTMLElement {
 *     constructor() {
 *         Object.assign(this, canAnnounceElement);
 *     }
 *     async connectedCallback() {
 *         await this.announce();
 *         // Now this.model is ready
 *         this.model.on('change', this.update.bind(this));
 *     }
 * }
*/
export default ({ eventName = 'announce-element', eventType, eventIdentifier } = {}) => {

    // Create a (private) promise that is resolved when the model changes (see setModel). Do not
    // define it within the object to not pollute its scope.
    let resolveModelInitializedPromise;
    const modelInitializedPromise = new Promise((resolve) => {
        resolveModelInitializedPromise = resolve;
    });

    return {
        model: undefined,
        /**
         * Dispatches announce event with a short delay; returns a promise that resolves after
         * the event was dispatched.
         */
        announce() {
            /* global CustomEvent */
            const event = new CustomEvent(eventName, {
                bubbles: true,
                detail: {
                    element: this,
                    eventType,
                    eventIdentifier,
                },
            });
            // Short delay to make sure event listeners on parent elements (where the event bubbles
            // to) are ready
            setTimeout(() => {
                this.dispatchEvent(event);
            });
            // Return promise that is resolved as soon as setModel is called for the first time
            return modelInitializedPromise;
        },
        setModel(model) {
            this.model = model;
            resolveModelInitializedPromise();
        },
    };

};

