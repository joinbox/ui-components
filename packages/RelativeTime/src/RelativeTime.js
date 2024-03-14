import readAttribute from '../../tools/src/readAttribute.mjs';
import getRelativeTimeUnitAndValue from './getRelativeTimeUnitAndValue.mjs';

/* global HTMLElement */

/**
 * Custom element that displays a relative time (e.g. '5 days ago') based on a timestamp passed
 * through the `data-time` attribute. For details, see README.md.
 */
export default class extends HTMLElement {

    connectedCallback() {
        this.#setup();
    }

    #setup() {
        const time = readAttribute(
            this,
            'data-time',
            {
                // Don't transform empty attribute value; if we do assume 0, this misbehavior will
                // be hard to debug.
                transform: (value) => value !== null && new Date(value),
                validate: (value) => value && !Number.isNaN(value.getTime()),
                expectation: 'a valid date',
            },
        );
        // Intl.RelativeTimeFormat basically takes everything as locale input
        const locale = readAttribute(
            this,
            'data-locale',
        );
        const formatted = this.#getRelativeTime(time.getTime(), locale);
        this.#displayTime(formatted);
    }

    #getRelativeTime(timeStamp, locale) {
        const { unit, value } = getRelativeTimeUnitAndValue(timeStamp - Date.now());
        // Construct arguments in a way that only uses locale if it's defined
        const formatterArguments = [...(locale ? [locale] : []), { style: 'short', numeric: 'auto' }];
        const formatter = new Intl.RelativeTimeFormat(...formatterArguments);
        return formatter.format(value, unit);
    }

    #displayTime(formattedDate) {
        this.textContent = formattedDate;
    }

}
