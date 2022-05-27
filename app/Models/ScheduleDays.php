<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScheduleDays extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'schedule_days';

    /**
     * @var string[]
     */
    protected $fillable = [
        'service_id',
        'weekday',
        'from',
        'to',
        'mining_level',
    ];
}
