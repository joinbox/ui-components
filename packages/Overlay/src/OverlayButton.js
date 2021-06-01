import getAndValidateAttribute from '../../../src/shared/getAndValidateAttribute.mjs';
import canAnnounceElement from '../../../src/shared/canAnnounceElement.js';
import createListener from '../../../src/shared/createListener.mjs';

/* global HTMLElement */

/**
 * Button that opens or closes or toggles an overlay. Requires
 * attributes data-button-type (open/close/toggle) and data-overlay-name.
 */
export default class extends HTMLElement {

    constructor() {
        super();
        this.readAttributes();
        Object.assign(
            this,
            canAnnounceElement({ eventType: 'overlay-button', eventIdentifier: this.name }),
        );
        this.setupClickListener();
    }

    async connectedCallback() {
        await this.announce();
        this.handleModelChanges();
        this.updateDOM();
    }

    readAttributes() {
        this.name = this.getName();
        this.type = this.getType();
        const [openClass, closedClass] = this.getClassNames();
        this.openClass = openClass;
        this.closedClass = closedClass;
    }

    getClassNames() {
        return [
            getAndValidateAttribute({
                element: this,
                name: 'data-open-class-name',
            }),
            getAndValidateAttribute({
                element: this,
                name: 'data-closed-class-name',
            }),
        ];
    }

    /**
     * Reads overlay name from DOM, stores it in this.name
     * @private
     */
    getName() {
        return getAndValidateAttribute({
            element: this,
            name: 'data-overlay-name',
            validate: value => value && typeof value === 'string',
        });
    }

    /**
     * Reads button type from DOM, stores it in this.type. Defaults to 'toggle'.
     * @private
     */
    getType() {
        return getAndValidateAttribute({
            element: this,
            name: 'data-type',
            validate: value => !value || ['toggle', 'open', 'close'].includes(value),
        }) || 'toggle';
    }

    /**
     * @private
     */
    setupClickListener() {
        createListener(this, 'click', this.handleClick.bind(this));
    }

    /**
     * @private
     */
    handleClick() {
        this.model[this.type]();
    }

    /**
     * @private
     */
    handleModelChanges() {
        this.model.on('change', this.updateDOM.bind(this));
    }

    /**
     * @private
     */
    updateDOM() {
        /* global requestAnimationFrame */
        requestAnimationFrame(() => {
            if (this.model.isOpen) {
                this.classList.remove(this.closedClass);
                this.classList.add(this.openClass);
            } else {
                this.classList.remove(this.openClass);
                this.classList.add(this.closedClass);
            }
        });
    }

}
