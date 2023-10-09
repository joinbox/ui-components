(function () {
    'use strict';

    /**
     * Reads, transforms and validates an attribute from an HTML element.
     */
    var readAttribute = (
        element,
        attributeName,
        {
            transform = (value) => value,
            validate = () => true,
            expectation = '(expectation not provided)',
        } = {},
    ) => {
        const value = element.getAttribute(attributeName);
        const transformedValue = transform(value);
        if (!validate(transformedValue)) {
            throw new Error(`Expected attribute ${attributeName} of element ${element.outerHTML} to be ${expectation}; got ${transformedValue} instead (${value} before the transform function was applied).`);
        }
        return transformedValue;
    };

    /**
     * Returns the (best matching) unit and value for a given timestamp – e.g. { value: 5, unit: 'day']
     * for a timestamp that is 4.7 days in the past.
     * @param {number} timeDifferenceInMS           time difference in milliseconds
     * @returns {Object.<string, number|string>}    Object with keys value (number) and unit (string);
     *                                              units are valid values for Intl.RelativeTimeFormat
     */
    var getRelativeTimeUnitAndValue = (timeDifferenceInMS) => {
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        const week = 7 * day;
        const month = 30 * day;
        // Format: Key is the unit known by RelativeTimeFormat, value[0] is the corresponding unit
        // in milliseconds, value[1] is the maximum value for which that unit shall be used
        const units = {
            minute: [minute, 45],
            hour: [hour, 36],
            day: [day, 10],
            week: [week, 6],
            month: [month, 10],
        };
        const absoluteDiff = Math.abs(timeDifferenceInMS);
        const unit = [...Object.entries(units)]
            .find((item) => absoluteDiff < (item[1][0] * item[1][1])) || ['year', [day * 355]];
        return {
            value: Math.round(absoluteDiff / (unit[1][0])) * Math.sign(timeDifferenceInMS),
            unit: unit[0],
        };
    };

    /* global HTMLElement */

    /**
     * Custom element that displays a relative time (e.g. '5 days ago') based on a timestamp passed
     * through the `data-time` attribute. For details, see README.md.
     */
    class RelativeTime extends HTMLElement {

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

    /* global window */
    if (!window.customElements.get('relative-time')) {
        window.customElements.define('relative-time', RelativeTime);
    }

})();
