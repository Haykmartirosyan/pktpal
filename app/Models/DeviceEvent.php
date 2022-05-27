<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceEvent extends Model
{
    use HasFactory;

    /**
     * DeviceEvent constructor.
     *
     * @param array $attributes
     */
    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->setConnection(config('database.events_connection'));
    }

    /**
     * @var string
     */
    protected $table = 'device_events';

    /**
     * @var array
     */
    protected $fillable = [
        'service_id',
        'event',
        'data',
        'mac_address',
        'sign_req',
        'msg',
        'wallet_address',
        'pkteer_token',
    ];
}
