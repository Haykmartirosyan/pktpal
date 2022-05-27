<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DevicePairingOption extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'device_pairing_options';

    /**
     * @var array
     */
    protected $fillable = [
        'mac_address',
        'url',
    ];
}
