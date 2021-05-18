import canEmitEvents from '../../src/shared/canEmitEvents.mjs';

export default class {

    isOverlayOpen = false;

    constructor() {
        Object.assign(this, canEmitEvents());
    }

    open() {
        // Prevent unnecessarily emitted event
        if (this.isOverlayOpen) return;
        this.isOverlayOpen = true;
        this.emit('change');
    }

    close() {
        // Prevent unnecessarily emitted event
        if (!this.isOverlayOpen) return;
        this.isOverlayOpen = false;
        this.emit('change');
    }

    toggle() {
        this.isOverlayOpen = !this.isOverlayOpen;
        this.emit('change');
    }


    get isOpen() {
        return this.isOverlayOpen;
    }

}
