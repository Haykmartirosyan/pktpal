<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Bavix\LaravelClickHouse\Database\Eloquent\Model;

class PermitsNoToken extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'permits_no_token';
}
