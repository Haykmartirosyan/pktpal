<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API V1 Routes
|--------------------------------------------------------------------------
*/

Route::group(['namespace' => 'api\v2', 'middleware' => 'CORS'], static function () {
    Route::get('/recommended-pools', 'DeviceController@recommendedPools');
    Route::post('/register', 'RegisterController@registerDevice');
    Route::post('/status/report', 'StatusReportsController@setStatusReport');
});

