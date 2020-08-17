/**
 * Simple EventEmitter mixin; use our own implementation as a) most NPM modules don't provide an
 * ES6 export and b) they're not made to be used as mixins.
 */
export default {

    /**
     * Map that holds all callbacks for all types
     * @type Map.<*, function[]>
    */
    eventHandlers: new Map(),

    /**
     * Adds event handler for a given type
     * @param {*} type               Name of the event handler
     * @param {function} callback    Callback to call if corresponding event is emitted
    */
    on(type, callback) {
        if (!this.eventHandlers.has(type)) this.eventHandlers.set(type, [callback]);
        else this.eventHandlers.get(type).push(callback);
    },

    /**
     * Removes an event handler; if only type is given, all callbacks of the type will be removed.
     * If type and callback are given, only the specific callbacks for the given type will be
     * removed.
     * @param {*} type               Type of event handler to remove
     * @param {function} callback    Callback to remove
     */
    off(type, callback) {
        if (!this.eventHandlers.has(type)) return;
        if (!callback) this.eventHandlers.delete(type);
        else {
            this.eventHandlers.set(type,this.eventHandlers.get(type).filter(cb => cb !== callback));
        }
    },

    /**
     * Calls all callbacks of the provided type with the given parameters.
     * @param {*} type          Type of eventHandler to call
     * @param {...*} params     Parameters to pass to callbacks
     */
    emit(type, ...params) {
        (this.eventHandlers.get(type) || []).forEach(handler => handler(...params));
    },
};
