import Emitter from "../../services/emitter";
import * as Sentry from "@sentry/react";

/**
 *
 * @param checked
 * @param id
 * @returns {Promise<unknown>}
 */
export function handleShutDownHelper(checked, id) {
    let data = {
        shut_down: !checked,
        event: 'halt'
    };
    return new Promise((resolve, reject) => {
        axios.post(api_routes.admin.dashboard.shutDown(id), data).then(response => {
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
 * @param id
 * @returns {Promise<unknown>}
 */
export function changeDeviceEnv(id) {
    return new Promise((resolve, reject) => {
        let data = {
            event: 'switch_env'
        };
        axios.post(api_routes.admin.dashboard.changeDeviceEnv(id), data).then(response => {
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
 * @param id
 * @returns {Promise<unknown>}
 */
export function rebootDevice(id) {
    return new Promise((resolve, reject) => {
        let data = {
            event: 'reboot'
        };
        axios.post(api_routes.admin.dashboard.rebootDevice(id), data).then(response => {
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
 * @param id
 * @returns {Promise<unknown>}
 */
export function getPktService(id) {
    return new Promise((resolve, reject) => {
        axios.get(api_routes.admin.dashboard.pktDetails(id)).then(response => {
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
 * @param id
 * @param skip
 * @returns {Promise<unknown>}
 */
export function getAlertLogs(id, skip) {
    return new Promise((resolve, reject) => {
        let data = {
            params: {
                skip: skip
            }
        };
        axios.get(api_routes.admin.dashboard.alertLogs(id), data).then(response => {
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
 * @param id
 * @param skip
 * @returns {Promise<unknown>}
 */
export function getPacketCryptLogs(id, skip) {
    return new Promise((resolve, reject) => {
        let data = {
            params: {
                skip: skip
            }
        };
        axios.get(api_routes.admin.dashboard.packetCryptLogs(id), data).then(response => {
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
 * @param id
 * @param skip
 * @returns {Promise<unknown>}
 */
export function getWalletLogs(id, skip) {
    return new Promise((resolve, reject) => {
        let data = {
            params: {
                skip: skip
            }
        };
        axios.get(api_routes.admin.dashboard.walletLogs(id), data).then(response => {
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
 * @param id
 * @param skip
 * @returns {Promise<unknown>}
 */
export function getNodeRunnerLogs(id, skip) {
    return new Promise((resolve, reject) => {
        let data = {
            params: {
                skip: skip
            }
        };
        axios.get(api_routes.admin.dashboard.nodeRunnerLogs(id), data).then(response => {
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
 * @param id
 * @param skip
 * @returns {Promise<unknown>}
 */
export function getSystemLogs(id, skip) {
    return new Promise((resolve, reject) => {
        let data = {
            params: {
                skip: skip
            }
        };
        axios.get(api_routes.admin.dashboard.systemLogs(id), data).then(response => {
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
 * @param id
 * @param skip
 * @returns {Promise<unknown>}
 */
export function getIPAddresses(id, skip) {
    return new Promise((resolve, reject) => {
        let data = {
            params: {
                skip: skip
            }
        };
        axios.get(api_routes.admin.dashboard.ipAddresses(id), data).then(response => {
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
 * @param id
 * @param skip
 * @returns {Promise<unknown>}
 */
export function getPermitsNoTokenAlerts(id, skip) {
    return new Promise((resolve, reject) => {
        let data = {
            params: {
                skip: skip
            }
        };
        axios.get(api_routes.admin.dashboard.permitsNoTokenAlerts(id), data).then(response => {
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
 * @param id
 * @param skip
 * @returns {Promise<unknown>}
 */
export function getPermitsTokenAlerts(id, skip) {
    return new Promise((resolve, reject) => {
        let data = {
            params: {
                skip: skip
            }
        };
        axios.get(api_routes.admin.dashboard.permitsTokenAlerts(id), data).then(response => {
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
 * @param e
 * @param text
 * @param date
 * @param type
 */
export function showLogMore(e, text, date, type) {
    e.preventDefault();

    Emitter.emit('showLogModal',
        {
            text: text,
            date: date,
            type: type,
        }
    );
}
