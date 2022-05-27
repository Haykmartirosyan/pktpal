<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceOption extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'device_options';

    /**
     * @var string[]
     */
    protected $fillable = [
        'service_id',
        'option',
        'value',
    ];
}
