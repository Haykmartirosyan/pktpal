<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/domain/login', 'user\UserController@domainLogin');
Route::get('/domain/logout', 'user\UserController@domainLogout');

Route::get('/pairing/success', 'user\PairingController@pairingSuccess');
Route::get('/pairing/failure', 'user\PairingController@pairingFailure');

Route::view('/{path?}', 'index')->where('path', '^((?!api).)*');
