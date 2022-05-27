<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API V1 Routes
|--------------------------------------------------------------------------
*/

Route::group(['namespace' => 'api\v1', 'middleware' => 'CORS'], static function () {
    Route::post('/register', 'RegisterController@registerDevice');

    Route::get('/events', 'EventsController@getEvents');

    Route::post('/status/report', 'StatusReportsController@setStatusReport');

    Route::group(['prefix' => '/result'], function () {
        Route::post('/transaction', 'TransactionsController@updateTransactionStatus');
        Route::post('/rackmode', 'RackModeController@setStatusRackMode');
        Route::post('/unpair', 'UnpairController@setStatusUnpair');
        Route::post('/export_seed', 'ExportSeedController@setSeedData');
        Route::post('/reboot', 'RebootController@setRebootData');
        Route::post('/halt', 'DeviceController@setShutDownData');
        Route::post('/switch_env', 'SwitchEnvController@setSwitchEnvData');
        Route::post('/add_dd', 'DirectDebitController@setAddDirectDebitData');
        Route::post('/rem_dd', 'DirectDebitController@setRemoveDirectDebitData');
        Route::post('/spend_dd', 'DirectDebitController@setSpendDirectDebitData');
        Route::post('/alter_sl', 'DirectDebitController@setAlterDirectDebitData');
    });


    Route::post('/provision', 'ProvisionsController@createProvision');
    Route::get('/seed', 'ProvisionsController@getSeed');
    Route::get('/secret', 'ProvisionsController@getSecret');
    Route::post('/authorize', 'ProvisionsController@authorizeProvision');

    Route::get('/recommended-pools', 'DeviceController@recommendedPools');
    Route::get('/pools', 'RecommendedPoolsController@getAllPools');
});

