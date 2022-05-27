<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecommendedPoolsRate extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'recommended_pools_rates';

    /**
     * @var array
     */
    protected $fillable = [
        'recommended_pools',
        'rates',
        'errors',
        'errors_count',
        'yields'
    ];

}
