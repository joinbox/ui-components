import canEmitEvents from '../shared/canEmitEvents.mjs';

export default class {

    #isOpen = false;

    constructor() {
        Object.assign(this, canEmitEvents());
    }

    open() {
        // Prevent unnecessarily emitted event
        if (this.#isOpen) return;
        this.#isOpen = true;
        this.emit('change');
    }

    close() {
        // Prevent unnecessarily emitted event
        if (!this.#isOpen) return;
        this.#isOpen = false;
        this.emit('change');
    }

    toggle() {
        this.#isOpen = !this.#isOpen;
        this.emit('change');
    }


    get isOpen() {
        return this.#isOpen;
    }

}
