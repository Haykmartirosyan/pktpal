import Emitter from "../../services/emitter";
import moment from "moment";
import * as Sentry from "@sentry/react";


/**
 *
 * @param weekday
 * @param hours
 * @param selectedHours
 */
export function openSetScheduleModal(weekday, hours, selectedHours) {
    let data = {
        weekday: weekday,
        hours: hours,
        selectedHours: selectedHours
    };

    Emitter.emit('openSetScheduleModal', data)
}

/**
 *
 * @param splitCount
 * @param start
 * @param item
 * @returns {*[]}
 */
export function splitHours(splitCount, start, item) {
    let hoursObject = [];

    if (splitCount === -23) {
        hoursObject.push({
            from: '23:00',
            to: '00:00',
            mining_level: item.mining_level,
        })
    } else {
        hoursObject.push({
            from: start,
            to: item.from.add(1, 'hours').format('HH:mm'),
            mining_level: item.mining_level,
        })
    }

    return hoursObject;
}


/**
 *
 * @param id
 * @param data
 * @returns {Promise<unknown>}
 */
export function getSettings(id, data = null) {
    let body = {};
    if (data) {
        body = data
    } else {
        body = {
            params: {
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };
    }

    return new Promise((resolve, reject) => {
        axios.get(api_routes.user.getSettings(id), body).then(response => {
            return response.data;
        }).then(json => {
            resolve(json);
        }).catch(error => {
            Sentry.captureException(error);
            reject(error)
        });
    });
}


/**
 *
 * @param serviceId
 * @param sendingData
 * @returns {Promise<unknown>}
 */
export function createSettings(serviceId, sendingData) {
    return new Promise((resolve, reject) => {
        axios.post(api_routes.user.createSettings(serviceId), sendingData).then(response => {
            return response;
        }).then(json => {
            resolve(json);
        }).catch(error => {
            Sentry.captureException(error);
            reject(error)
        });
    })
}


/**
 *
 * @param serviceId
 * @param sendingData
 * @returns {Promise<unknown>}
 */
export function updateSMSOption(serviceId, sendingData) {
    return new Promise((resolve, reject) => {
        axios.post(api_routes.user.updateSMSOption(serviceId), sendingData).then(response => {
            return response;
        }).then(json => {
            resolve(json);
        }).catch(error => {
            Sentry.captureException(error);
            reject(error)
        });
    })
}


/**
 *
 * @param serviceId
 * @param sendingData
 * @returns {Promise<unknown>}
 */
export function updateSettings(serviceId, sendingData) {
    return new Promise((resolve, reject) => {
        axios.post(api_routes.user.updateSettings(serviceId), sendingData).then(response => {
            return response;
        }).then(json => {
            resolve(json);
        }).catch(error => {
            Sentry.captureException(error);
            reject(error)
        });
    })
}


/**
 *
 * @param serviceId
 * @returns {Promise<unknown>}
 */
export function deleteScheduledService(serviceId) {
    return new Promise((resolve, reject) => {
        axios.delete(api_routes.user.deleteSettings(serviceId)).then(response => {
            return response;
        }).then(json => {
            resolve(json);
        }).catch(error => {
            Sentry.captureException(error);
            reject(error)
        });
    })
}

/**
 *
 * @returns {Promise<unknown>}
 */
export function generateSchedule(weekdays) {
    let body = {
        weekdays: weekdays
    };

    return new Promise((resolve, reject) => {
        axios.post(api_routes.user.generateSchedule(), body).then(response => {
            return response;
        }).then(json => {
            resolve(json);
        }).catch(error => {
            Sentry.captureException(error);
            reject(error)
        });
    })
}

/**
 *
 * @param data
 */
export function orderWeekdays(data) {
    const sorter = {
        "sunday": 0,
        "monday": 1,
        "tuesday": 2,
        "wednesday": 3,
        "thursday": 4,
        "friday": 5,
        "saturday": 6,
    };

    data.sort(function sortByDay(a, b) {
        let day1 = a.weekday.toLowerCase();
        let day2 = b.weekday.toLowerCase();
        return sorter[day1] - sorter[day2];
    });

}

/**
 *
 * @type {*[]}
 */
export const weekdays = [
    {
        weekday: "Sunday",
        hours: [],
    },
    {
        weekday: "Monday",
        hours: [],
    },
    {
        weekday: "Tuesday",
        hours: [],
    },
    {
        weekday: "Wednesday",
        hours: [],
    },
    {
        weekday: "Thursday",
        hours: [],
    },
    {
        weekday: "Friday",
        hours: [],
    },
    {
        weekday: "Saturday",
        hours: [],
    },
];

/**
 *
 * @type {*[]}
 */
export const hours = [
    {
        from: moment('00:00', 'HH:mm'),
        to: moment('01:00', 'HH:mm'),
    },
    {
        from: moment('01:00', 'HH:mm'),
        to: moment('02:00', 'HH:mm'),
    },
    {
        from: moment('02:00', 'HH:mm'),
        to: moment('03:00', 'HH:mm'),
    },
    {
        from: moment('03:00', 'HH:mm'),
        to: moment('04:00', 'HH:mm'),
    },
    {
        from: moment('04:00', 'HH:mm'),
        to: moment('05:00', 'HH:mm'),
    },
    {
        from: moment('05:00', 'HH:mm'),
        to: moment('06:00', 'HH:mm'),
    },
    {
        from: moment('06:00', 'HH:mm'),
        to: moment('07:00', 'HH:mm'),
    },
    {
        from: moment('07:00', 'HH:mm'),
        to: moment('08:00', 'HH:mm'),
    },
    {
        from: moment('08:00', 'HH:mm'),
        to: moment('09:00', 'HH:mm'),
    },
    {
        from: moment('09:00', 'HH:mm'),
        to: moment('10:00', 'HH:mm'),
    },
    {
        from: moment('10:00', 'HH:mm'),
        to: moment('11:00', 'HH:mm'),
    },
    {
        from: moment('11:00', 'HH:mm'),
        to: moment('12:00', 'HH:mm'),
    },
    {
        from: moment('12:00', 'HH:mm'),
        to: moment('13:00', 'HH:mm'),
    },
    {
        from: moment('13:00', 'HH:mm'),
        to: moment('14:00', 'HH:mm'),
    },
    {
        from: moment('14:00', 'HH:mm'),
        to: moment('15:00', 'HH:mm'),
    },
    {
        from: moment('15:00', 'HH:mm'),
        to: moment('16:00', 'HH:mm'),
    },
    {
        from: moment('16:00', 'HH:mm'),
        to: moment('17:00', 'HH:mm'),
    },
    {
        from: moment('17:00', 'HH:mm'),
        to: moment('18:00', 'HH:mm'),
    },
    {
        from: moment('18:00', 'HH:mm'),
        to: moment('19:00', 'HH:mm'),
    },
    {
        from: moment('19:00', 'HH:mm'),
        to: moment('20:00', 'HH:mm'),
    },
    {
        from: moment('20:00', 'HH:mm'),
        to: moment('21:00', 'HH:mm'),
    },
    {
        from: moment('21:00', 'HH:mm'),
        to: moment('22:00', 'HH:mm'),
    },
    {
        from: moment('22:00', 'HH:mm'),
        to: moment('23:00', 'HH:mm'),
    },
    {
        from: moment('23:00', 'HH:mm'),
        to: moment('00:00', 'HH:mm'),
    },
];

/**
 *
 * @type {*[]}
 */
export const hoursString = [
    {
        from: '00:00',
        to: '01:00',
    },
    {
        from: '01:00',
        to: '02:00',
    },
    {
        from: '02:00',
        to: '03:00',
    },
    {
        from: '03:00',
        to: '04:00',
    },
    {
        from: '04:00',
        to: '05:00',
    },
    {
        from: '05:00',
        to: '06:00',
    },
    {
        from: '06:00',
        to: '07:00',
    },
    {
        from: '07:00',
        to: '08:00',
    },
    {
        from: '08:00',
        to: '09:00',
    },
    {
        from: '09:00',
        to: '10:00',
    },
    {
        from: '10:00',
        to: '11:00',
    },
    {
        from: '11:00',
        to: '12:00',
    },
    {
        from: '12:00',
        to: '13:00',
    },
    {
        from: '13:00',
        to: '14:00',
    },
    {
        from: '14:00',
        to: '15:00',
    },
    {
        from: '15:00',
        to: '16:00',
    },
    {
        from: '16:00',
        to: '17:00',
    },
    {
        from: '17:00',
        to: '18:00',
    },
    {
        from: '18:00',
        to: '19:00',
    },
    {
        from: '19:00',
        to: '20:00',
    },
    {
        from: '20:00',
        to: '21:00',
    },
    {
        from: '21:00',
        to: '22:00',
    },
    {
        from: '22:00',
        to: '23:00',
    },
    {
        from: '23:00',
        to: '00:00',
    },
];

/**
 *
 * @type {[{value: string, key: string}, {value: string, key: string}, {value: string, key: string}, {value: string, key: string}, {value: string, key: string}]}
 */
export const miningLevels = [
    {
        key: 'off',
        value: "Off"
    },
    {
        key: 'low',
        value: "Low"
    },
    {
        key: 'medium',
        value: "Medium"
    },
    {
        key: 'high',
        value: "High"
    },
    {
        key: 'unlimited',
        value: "Unlimited"
    },
    {
        key: 'experimental',
        value: "Experimental"
    }
];

/**
 *
 * @returns {boolean}
 */
export function isIOSDevice() {
    return !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
}

/**
 *
 * @returns {boolean}
 */
export function setOrientation() {
    let setting = false;

    if (isIOSDevice()) {

        let mql = window.matchMedia("(orientation: landscape)");

        setting = mql.matches;
    } else {
        if (window.screen.orientation.type === "landscape-primary" || window.screen.orientation.type === "landscape-secondary") {
            setting = true;
        } else if (window.screen.orientation.type === "portrait-primary" || window.screen.orientation.type === "portrait-secondary") {
            setting = false;
        }

    }

    return setting;
}

