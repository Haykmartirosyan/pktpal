<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::group(['middleware' => 'CORS', 'namespace' => 'user'], function () {
    Route::post('/auth/login', 'UserController@login');

    Route::group(['middleware' => 'auth:api'], function () {
        Route::get('/auth/logout', 'UserController@logout');
        Route::get('/auth/user', 'UserController@getUserData');

        Route::group(['prefix' => 'user/pkt/'], function () {
            Route::get('services', 'PktController@index');
            Route::get('services/wallets', 'PktController@getServicesWallets');
            Route::get('pair/option/{id}', 'PktController@getServicePairOption');
            Route::get('paired/devices/{id}', 'PktController@getPairedDevices');
            Route::get('service/{id}', 'PktController@getService');
            Route::put('service/update/{id}', 'PktController@update');
            Route::post('set/pair/token', 'PktController@setDevicePairToken');
            Route::post('set/long/pairing', 'PktController@errorPairing');
            Route::put('agent/update', 'PktController@updateUserAgentData');

            Route::get('service/{id}/encryptions', 'EncryptionController@getEncryptionsData');
            Route::get('service/{id}/offline/logs', 'EncryptionController@getOfflineLogs');

            Route::get('status/report/{id}', 'StatusReportsController@getStatusReport');

            Route::post('rack/mode/enable', 'EventsController@enableRackMode');
            Route::post('rack/mode/disable', 'EventsController@disableRackMode');

            Route::post('cube/settings/create/{id}', 'SettingsController@create');
            Route::post('cube/settings/update/{id}', 'SettingsController@update');
            Route::post('cube/settings/update/{id}/sms-option', 'SettingsController@updateSMSOption');
            Route::get('settings/{id}', 'SettingsController@index');
            Route::delete('cube/settings/delete/{id}', 'SettingsController@delete');
            Route::post('cube/settings/generate', 'SettingsController@generateSchedule');

            Route::post('seed/export', 'EventsController@exportSeed');
            Route::post('send', 'EventsController@sendPkt');
            Route::post('device/unpair', 'EventsController@unPairDevice');
        });

        Route::group(['prefix' => 'user/bill/', 'namespace' => 'bill'], function () {
            Route::get('services', 'ServicesController@index');
            Route::post('create/payment', 'ServicesController@createBillPayment');
            Route::post('update/payment', 'ServicesController@updateBillPayment');
            Route::post('discard/payment', 'ServicesController@discardBillPayment');
            Route::get('transactions/history/{serviceId}', 'ServicesController@getTransactionsHistory');
            Route::get('transactions/notifications/{serviceId}', 'ServicesController@getTransactionsNotifications');
            Route::get('upcoming/payments', 'ServicesController@getUpcomingPayments');
            Route::get('recent/payments', 'ServicesController@getRecentPayments');
            Route::post('service/make/favorite', 'ServicesController@toggleServiceFavorite');
            Route::get('services/favorite', 'ServicesController@getUserFavoriteServices');
            Route::post('{id}/add/direct/debit', 'DirectDebitController@addDirectDebit');
            Route::post('{id}/remove/direct/debit', 'DirectDebitController@removeDirectDebit');
        });
    });
});

Route::group(['middleware' => 'CORS', 'namespace' => 'admin\dashboard'], function () {
    Route::group(['middleware' => 'auth:api'], function () {

        Route::group(['prefix' => 'admin/dashboard/'], function () {
            Route::get('main', 'MainController@index');
            Route::get('ordered/users', 'MainController@getOrderedUsers');
            Route::post('assign/device', 'MainController@assignDevice');

            Route::get('unassigned/devices', 'OrdersController@unassignedDevices');
            Route::get('orders', 'OrdersController@getOrders');
            Route::post('devices/assign', 'OrdersController@setAssignedDevices');

            Route::group(['prefix' => 'service/{id}'], function () {
                Route::get('', 'PktController@details');
                Route::post('/shut/down', 'EventsController@shutDown');
                Route::get('/system/logs', 'PktController@systemLogs');
                Route::get('/noderunner/logs', 'PktController@nodeRunnerLogs');
                Route::get('/ip/addresses', 'PktController@ipAddresses');
                Route::post('/reboot', 'EventsController@reboot');
                Route::post('/switch_env', 'EventsController@changeDeviceEnv');
                Route::get('/wallet/logs', 'PktController@walletLogs');
                Route::get('/packetcrypt/logs', 'PktController@packetCryptLogs');
                Route::get('/alert/logs', 'PktController@alertLogs');
                Route::get('/permitsnotoken/alerts', 'PktController@permitsNoTokenLogs');
                Route::get('/permitstoken/alerts', 'PktController@permitsTokenLogs');
            });

            Route::get('permitsnotoken/alerts', 'SettingsController@permitsNoTokenAlerts');
            Route::post('save/recommendedpools', 'SettingsController@setRecommendedPools');
            Route::get('recommendedpools', 'SettingsController@getRecommendedPools');
            Route::get('recommendedpools/rates', 'SettingsController@getRecommendedPoolsRates');
            Route::post('save/recommendedpools/statistics', 'SettingsController@setRecommendedPoolsStatistics');

            Route::post('activity/log/add/{id}', 'PktController@createActivityLog');

            Route::post('alert/add/{id}', 'AlertsController@create');
            Route::post('alert/clear/{id}', 'AlertsController@clear');

            Route::get('analytics/offline/services', 'AnalyticsController@getOfflineServicesCount');
            Route::get('analytics/offline/services/by/hours', 'AnalyticsController@getOfflineServicesByHours');
            Route::get('analytics/online/services', 'AnalyticsController@getOnlineServicesCount');

            Route::post('clickhouse/logs', 'ClickhouseController@getLogs');
        });

        Route::group(['prefix' => 'admin/notifications/'], function () {
            Route::get('/', 'NotificationsController@index');
            Route::get('unread/count', 'NotificationsController@unreadNotificationsCount');
            Route::post('read/all', 'NotificationsController@readAllNotifications');
            Route::post('read/{id}', 'NotificationsController@readNotification');

        });
    });
});

Route::group(['middleware' => 'CORS', 'namespace' => 'financialManager\bill'], function () {
    Route::group(['middleware' => 'auth:api'], function () {

        Route::group(['prefix' => 'financialManager/bill/'], function () {
            Route::get('payments', 'PaymentsController@index');
            Route::get('payments/logs', 'PaymentsController@getPaymentLogs');
            Route::post('payment/{id}/update/status', 'PaymentsController@updatePaymentStatus');
            Route::get('payment/details/{id}', 'PaymentsController@getPaymentDetails');
            Route::post('payments/fail/log', 'PaymentsController@addFailedLog');
            Route::post('{id}/spend/direct/debit', 'DirectDebitController@spendDirectDebit');
            Route::post('{id}/alter/direct/debit', 'DirectDebitController@alterDirectDebit');
        });
    });
});

/* API V1 */
Route::group(['prefix' => 'v1'], static function () {
    require base_path('routes/v1/api.php');
});


/* API V2 */
Route::group(['prefix' => 'v2'], static function () {
    require base_path('routes/v2/api.php');
});
