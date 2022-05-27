<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DevicePairing extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * @var string
     */
    protected $table = 'device_pairings';

    /**
     * @var string[]
     */
    protected $fillable = [
        'device_unique_key',
        'service_id',
        'last_login',
        'user_agent',
        'country',
        'logo'
    ];
}
