import * as Sentry from "@sentry/react";

/**
 *
 * @param id
 * @returns {Promise<unknown>}
 */
export function toggleFavorite(id) {
    let data = {
        billService: id
    };
    return new Promise((resolve, reject) => {
        axios.post(api_routes.user.bill.toggleFavorite(), data).then(response => {
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
 * @returns {Promise<unknown>}
 */
export function getUserFavoriteServices(skipFavorite = null) {
    let data = {
        params: {
            skipFavorite: skipFavorite,
        }
    };
    return new Promise((resolve, reject) => {
        axios.get(api_routes.user.bill.favoriteServices(), data).then(response => {
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
 * @param completed
 * @param enoughFunds
 * @returns {Promise<unknown>}
 */
export function updatePaymentStatus(id, completed, enoughFunds) {
    return new Promise((resolve, reject) => {
        let data = {
            completed: completed,
            enough_funds: enoughFunds
        };
        axios.post(api_routes.financialManager.bill.updatePaymentStatus(id), data).then(response => {
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
 * @param data
 * @returns {Promise<unknown>}
 */
export function createPayment(data) {
    return new Promise((resolve, reject) => {
        axios.post(api_routes.user.bill.createPayment(), data).then(response => {
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
 * @param data
 * @returns {Promise<unknown>}
 */
export function updatePayment(data) {
    return new Promise((resolve, reject) => {
        axios.post(api_routes.user.bill.updatePayment(), data).then(response => {
            return response.data;
        }).then(json => {
            resolve(json);
        }).catch(error => {
            Sentry.captureException(error);
            reject(error)
        });
    });
}
