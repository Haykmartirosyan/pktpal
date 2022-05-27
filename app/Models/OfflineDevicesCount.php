<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OfflineDevicesCount extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'offline_devices_count';

    /**
     * @var string[]
     */
    protected $fillable = [
        'time',
        'count',
    ];
}
