<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Alert extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'alerts';

    /**
     * @var array
     */
    protected $fillable = [
        'service_id',
        'text',
    ];
}
