import * as Sentry from "@sentry/react";

/**
 * @param id
 * @returns {Promise<unknown>}
 */
export function getUserPktService(id) {
    return new Promise((resolve, reject) => {
        axios.get(api_routes.user.pktService(id)).then(response => {
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
 * @param id
 * @returns {Promise<unknown>}
 */
export function getUserPktServiceOption(id) {
    return new Promise((resolve, reject) => {
        axios.get(api_routes.user.pktServiceOption(id)).then(response => {
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
 * @param id
 * @returns {Promise<unknown>}
 */
export function getPairedDevices(id) {
    return new Promise((resolve, reject) => {
        axios.get(api_routes.user.pairedDevices(id)).then(response => {
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
 * @param id
 * @returns {Promise<unknown>}
 */
export function getStatusReport(id) {
    return new Promise((resolve, reject) => {
        axios.get(api_routes.user.getStatusReport(id)).then(response => {
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
 * @returns {Promise<unknown>}
 */
export function getExchangeRate() {
    return new Promise((resolve, reject) => {
        fetch('https://pktticker.tonygaitatzis.com/api/1.0/spot/PKT/USD/').then(response => {
            return response.json();
        }).then(json => {
            resolve(json);
        }).catch(error => {
            Sentry.captureException(error);
            reject(error)
        });
    });
}


/**
 * @param walletAddress
 * @returns {Promise<unknown>}
 */
export function balance(walletAddress) {
    return new Promise((resolve, reject) => {
        fetch('https://explorer.pkt.cash/api/v1/PKT/pkt/address/' + walletAddress).then(response => {
            return response.json();
        }).then(json => {
            resolve(json);
        }).catch(error => {
            Sentry.captureException(error);
            reject(error)

        });
    })
}

/**
 * @param walletAddress
 * @returns {Promise<unknown>}
 */
export function validateAddress(walletAddress) {
    return new Promise((resolve, reject) => {
        fetch('https://explorer.pkt.cash/api/PKT/pkt/valid/' + walletAddress).then(response => {
            return response.json();
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
 * @param walletAddress
 * @param period
 * @returns {Promise<unknown>}
 */
export function mining(walletAddress, period = null) {
    return new Promise((resolve, reject) => {
        let url = !period ? 'https://explorer.pkt.cash/api/v1/PKT/pkt/address/' + walletAddress + '/income/90?mining=only'
            : 'https://explorer.pkt.cash/api/v1/PKT/pkt/address/' + walletAddress + '/income/' + period + '?mining=only';
        fetch(url).then(response => {
            return response.json();
        }).then(json => {
            resolve(json);
        }).catch(error => {
            Sentry.captureException(error);
            reject(error)
        });
    })
}


/**
 * @param walletAddress
 * @returns {Promise<unknown>}
 */
export function transactions(walletAddress) {
    return new Promise((resolve, reject) => {
        fetch('https://explorer.pkt.cash/api/v1/PKT/pkt/address/' + walletAddress + '/coins?mining=excluded').then(response => {
            return response.json();
        }).then(json => {
            resolve(json);
        }).catch(error => {
            Sentry.captureException(error);
            reject(error)

        });
    })
}

/**
 * Get PKT Number (2 ** 30)
 * @param number
 * @param fromTransactions
 * @returns {string}
 */
export function pktNumber(number, fromTransactions = false) {
    number = (number / 2 ** 30);
    let plusDot = 3
    if (!fromTransactions) {
        number = number + 0.001;
    } else {
        if (number < 1) {
            plusDot = 5;
            number = number < 0.0001 ? number + 0.0001 : number + 0.00001;
        } else {
            number = number + 0.001;
        }
    }
    number = number.toString();

    let resultBalance = number;
    let dotIndex = number.search(/\./);
    let beforeDot = number.slice(0, dotIndex);
    let afterDot = resultBalance.slice(dotIndex, dotIndex + plusDot);
    let res = beforeDot.substring(0, 12).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return res + afterDot;
}

/**
 * @param data
 */
export function groupByMonth(data) {
    let months = {};
    for (let i = 0; i < data.length; i++) {
        let obj = data[i];
        let date = new Date(obj.date);
        let month = date.getMonth() + 1;
        if (months[month]) {
            months[month].push(obj);
        } else {
            months[month] = [obj];
        }
    }
    return months;
}

/**
 *
 * @param data
 * @returns {{}}
 */
export function groupByMonthAndYear(data) {
    let years = {};
    for (let i = 0; i < data.length; i++) {
        let obj = data[i];
        let date = new Date(obj.date);
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        let fullDate = year + '-' + month;
        if (years[fullDate]) {
            years[fullDate].push(obj);
        } else {
            years[fullDate] = [obj];
        }
    }
    return years;
}

/**
 *
 * @param skip
 * @returns {Promise<unknown>}
 */
export function getUserPktServices(skip = null) {
    let data = {
        params: {
            skip: skip ? skip : 0
        }
    };
    return new Promise((resolve, reject) => {
        axios.get(api_routes.user.pktServices(), data).then(response => {
            return response;
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
 * @returns {Promise<unknown>}
 */
export function getUserPktServicesWallets() {
    return new Promise((resolve, reject) => {
        axios.get(api_routes.user.pktServicesWallets()).then(response => {
            return response;
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
 * @param device
 * @returns {{}}
 */
export function setUserAgent(device) {
    let userAgent = {};
    if (device.device.type === 'desktop') {
        userAgent.userAgent = device.os.name + ' ' + device.os.version + ' ' + device.os.platform
    } else {
        if (device.device.brand === 'Apple' && device.device.type === '') {
            userAgent.userAgent = window.navigator.platform
        } else {
            userAgent.userAgent = device.device.brand + ' ' + device.device.model
        }
    }

    if (userAgent.userAgent == '' || userAgent.userAgent == null || userAgent.userAgent == undefined) {
        userAgent.userAgent = window.navigator.platform
    }
    userAgent.os = device.os.name;
    userAgent.type = device.device.type;
    return userAgent
}
