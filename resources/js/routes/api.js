let root = '/api';

module.exports = {
    root: root,

    user: {
        login() {
            return root + '/auth/login';
        },

        logout() {
            return root + '/auth/logout';
        },

        authUser() {
            return root + '/auth/user';
        },

        pktService(id) {
            return root + '/user/pkt/service/' + id;
        },

        pktServiceOption(id) {
            return root + '/user/pkt/pair/option/' + id;
        },

        pairedDevices(id) {
            return root + '/user/pkt/paired/devices/' + id;
        },

        updateService(id) {
            return root + '/user/pkt/service/update/' + id;
        },

        pktServices() {
            return root + '/user/pkt/services';
        },

        sendPkt() {
            return root + '/user/pkt/send';
        },

        getStatusReport(id) {
            return root + '/user/pkt/status/report/' + id;
        },

        setPairToken() {
            return root + '/user/pkt/set/pair/token';
        },

        longPairing() {
            return root + '/user/pkt/set/long/pairing';
        },

        setUserAgentData() {
            return root + '/user/pkt/agent/update';
        },

        unPairDevice() {
            return root + '/user/pkt/device/unpair';
        },

        enableRackMode() {
            return root + '/user/pkt/rack/mode/enable';
        },

        disableRackMode() {
            return root + '/user/pkt/rack/mode/disable';
        },

        pktServicesWallets() {
            return root + '/user/pkt/services/wallets';
        },

        pktServiceEncryptions(id) {
            return root + '/user/pkt/service/' + id + '/encryptions';
        },

        offlineLogs(id) {
            return root + '/user/pkt/service/' + id + '/offline/logs';
        },


        bill: {
            getBillServices() {
                return root + '/user/bill/services';
            },

            createPayment() {
                return root + '/user/bill/create/payment';
            },

            updatePayment() {
                return root + '/user/bill/update/payment';
            },

            discardPayment() {
                return root + '/user/bill/discard/payment';
            },

            transactionsHistory(id) {
                return root + '/user/bill/transactions/history/' + id;
            },

            transactionsNotifications(id) {
                return root + '/user/bill/transactions/notifications/' + id;
            },

            upcomingPayments() {
                return root + '/user/bill/upcoming/payments';
            },

            recentPayments() {
                return root + '/user/bill/recent/payments';
            },

            toggleFavorite() {
                return root + '/user/bill/service/make/favorite';
            },

            favoriteServices() {
                return root + '/user/bill/services/favorite';
            },

            addDirectDebit(id) {
                return root + '/user/bill/' + id + '/add/direct/debit';
            },

            removeDirectDebit(id) {
                return root + '/user/bill/' + id + '/remove/direct/debit';
            }
        },

        createSettings(id) {
            return root + '/user/pkt/cube/settings/create/' + id;
        },

        updateSettings(id) {
            return root + '/user/pkt/cube/settings/update/' + id;
        },

        updateSMSOption(id) {
            return root + '/user/pkt/cube/settings/update/' + id + '/sms-option';
        },

        getSettings(id) {
            return root + '/user/pkt/settings/' + id;
        },

        deleteSettings(id) {
            return root + '/user/pkt/cube/settings/delete/' + id;
        },

        generateSchedule(id) {
            return root + '/user/pkt/cube/settings/generate/';
        },

        seedExport() {
            return root + '/user/pkt/seed/export';
        }
    },

    financialManager: {
        bill: {
            getBillPayments() {
                return root + '/financialManager/bill/payments';
            },
            getPaymentDetails(id) {
                return root + `/financialManager/bill/payment/details/${id}`;
            },
            updatePaymentStatus(id) {
                return root + `/financialManager/bill/payment/${id}/update/status`;
            },
            getPaymentLogs() {
                return root + '/financialManager/bill/payments/logs';
            },
            addFailedLog() {
                return root + '/financialManager/bill/payments/fail/log';
            },
            spendDirectDebit(id) {
                return root + '/financialManager/bill/' + id + '/spend/direct/debit';
            },
            alterDirectDebit(id) {
                return root + '/financialManager/bill/' + id + '/alter/direct/debit';
            }
        }
    },

    admin: {
        dashboard: {
            main() {
                return root + '/admin/dashboard/main';
            },

            orderedUsers() {
                return root + '/admin/dashboard/ordered/users';
            },

            unassignedDevices() {
                return root + '/admin/dashboard/unassigned/devices';
            },

            assignDeviceToUser() {
                return root + '/admin/dashboard/assign/device';
            },

            pktDetails(id) {
                return root + '/admin/dashboard/service/' + id;
            },

            walletLogs(id) {
                return root + '/admin/dashboard/service/' + id + '/wallet/logs';
            },

            systemLogs(id) {
                return root + '/admin/dashboard/service/' + id + '/system/logs';
            },

            nodeRunnerLogs(id) {
                return root + '/admin/dashboard/service/' + id + '/noderunner/logs';
            },

            ipAddresses(id) {
                return root + '/admin/dashboard/service/' + id + '/ip/addresses';
            },

            rebootDevice(id) {
                return root + '/admin/dashboard/service/' + id + '/reboot';
            },

            changeDeviceEnv(id) {
                return root + '/admin/dashboard/service/' + id + '/switch_env';
            },

            packetCryptLogs(id) {
                return root + '/admin/dashboard/service/' + id + '/packetcrypt/logs';
            },

            alertLogs(id) {
                return root + '/admin/dashboard/service/' + id + '/alert/logs';
            },

            addAlert(id) {
                return root + '/admin/dashboard/alert/add/' + id;
            },

            addActivityLog(id) {
                return root + '/admin/dashboard/activity/log/add/' + id;
            },

            clearAlerts(id) {
                return root + '/admin/dashboard/alert/clear/' + id;
            },

            shutDown(id) {
                return root + '/admin/dashboard/service/' + id + '/shut/down';
            },

            permitsNoTokenAlerts(id) {
                return root + '/admin/dashboard/service/' + id + '/permitsnotoken/alerts';
            },

            permitsTokenAlerts(id) {
                return root + '/admin/dashboard/service/' + id + '/permitstoken/alerts';
            },

            permitsNoTokenAlertsAll() {
                return root + '/admin/dashboard/permitsnotoken/alerts';
            },

            savePools() {
                return root + '/admin/dashboard/save/recommendedpools';
            },

            recommendedPools() {
                return root + '/admin/dashboard/recommendedpools';
            },

            orders() {
                return root + '/admin/dashboard/orders';
            },

            assignDevices() {
                return root + '/admin/dashboard/devices/assign';
            },

            recommendedPoolsRates() {
                return root + '/admin/dashboard/recommendedpools/rates';

            },

            saveStatisticsPools() {
                return root + '/admin/dashboard/save/recommendedpools/statistics';
            },

            offlineServices() {
                return root + '/admin/dashboard/analytics/offline/services';
            },

            offlineByHours() {
                return root + '/admin/dashboard/analytics/offline/services/by/hours';
            },

            onlineServices() {
                return root + '/admin/dashboard/analytics/online/services';
            },

            getLogsFromClickhouse() {
                return root + '/admin/dashboard/clickhouse/logs';
            }
        },
        notifications: {
            unreadCount() {
                return root + '/admin/notifications/unread/count';
            },
            getUserNotifications() {
                return root + '/admin/notifications/';
            },
            readNotification(id) {
                return root + '/admin/notifications/read/' + id;
            },
            readAllNotifications() {
                return root + '/admin/notifications/read/all';
            }
        }
    }
};
