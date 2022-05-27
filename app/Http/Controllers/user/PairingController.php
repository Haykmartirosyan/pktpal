<?php

namespace App\Http\Controllers\user;

use App\Events\DevicePaired;
use App\Http\Controllers\Controller;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\View\Factory;
use Illuminate\Contracts\View\View;

class PairingController extends Controller
{
    /**
     * @return Application|Factory|View
     */
    public function pairingSuccess()
    {
        return view('pairingSuccess');
    }

    /**
     * @return Application|Factory|View
     */
    public function pairingFailure()
    {
        broadcast(new DevicePaired(null, 'error'));

        return view('pairingFailure');
    }
}
