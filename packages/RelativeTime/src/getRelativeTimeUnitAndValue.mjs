/**
 * Returns the (best matching) unit and value for a given timestamp – e.g. { value: 5, unit: 'day']
 * for a timestamp that is 4.7 days in the past.
 * @param {number} timeDifferenceInMS           time difference in milliseconds
 * @returns {Object.<string, number|string>}    Object with keys value (number) and unit (string);
 *                                              units are valid values for Intl.RelativeTimeFormat
 */
export default (timeDifferenceInMS) => {
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
